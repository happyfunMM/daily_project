from smbprotocol.connection import Connection
from smbprotocol.session import Session
from smbprotocol.tree import TreeConnect
from smbprotocol.open import Open, CreateOptions, FileAttributes, ShareAccess
import uuid
import sqlite3
import schedule
import time
import os
import logging
from datetime import datetime

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scan.log'),
        logging.StreamHandler()
    ]
)

# 配置信息
SERVER_IP = '10.128.0.30'      # 目标服务器IP
SHARE_NAME = 'itf'           # 共享文件夹名称
USERNAME = 'daisy'
PASSWORD = 'daisy@2026'
ROOT_PATH = 'customers\yhty-20260319'    # 根目录路径
DB_FILE = 'scan_results.db'  # 数据库文件

# 扫描配置 - 避免NAS过载
SCAN_INTERVAL = 0.1  # 扫描间隔（秒），避免过快访问
BATCH_SIZE = 10      # 批处理大小
MAX_CONCURRENT = 5   # 最大并发连接数
TIMEOUT = 30         # 超时时间（秒）

# 数据库结构
CREATE_TABLES = '''
CREATE TABLE IF NOT EXISTS scan_records (
    id TEXT PRIMARY KEY,
    seat TEXT,
    capture_date TEXT,
    scan_time TEXT,
    total_files INTEGER
);

CREATE TABLE IF NOT EXISTS file_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id TEXT,
    file_path TEXT,
    file_name TEXT,
    file_type TEXT,
    FOREIGN KEY (record_id) REFERENCES scan_records(id)
);
'''

class FolderScanner:
    def __init__(self):
        self.setup_database()
    
    def setup_database(self):
        """设置数据库"""
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.executescript(CREATE_TABLES)
        conn.commit()
        conn.close()
    
    def connect_smb(self):
        """建立SMB连接"""
        connection = Connection(uuid.uuid4(), SERVER_IP, 445)
        connection.connect()
        
        session = Session(connection, USERNAME, PASSWORD)
        session.connect()
        
        tree = TreeConnect(session, f"\\\\{SERVER_IP}\\{SHARE_NAME}")
        tree.connect()
        
        return connection, session, tree
    
    def parse_folder_path(self, path):
        """
        解析文件夹路径
        格式: root\seat03\20251215\2059cb4b-1094-4e70-9822-364434e89868
        返回: (seat, capture_date, id)
        """
        parts = path.split('\\')
        if len(parts) >= 4:
            seat = parts[1]  # root下第一层
            capture_date = parts[-2]  # 倒数第二层
            folder_id = parts[-1]  # 最后一层
            return seat, capture_date, folder_id
        return None, None, None
    
    def scan_folder(self, tree, current_path):
        """扫描文件夹"""
        try:
            # 添加扫描间隔
            time.sleep(SCAN_INTERVAL)
            
            open_file = Open(tree, current_path)
            open_file.create(
                impersonation_level=0,
                desired_access=0x00000001,
                file_attributes=0,
                share_access=ShareAccess.FILE_SHARE_READ,
                create_disposition=3,
                create_options=0
            )
            
            is_directory = bool(open_file.file_attributes & 0x00000010)
            
            if is_directory:
                files = open_file.query_directory('*')
                file_list = []
                
                for file_info in files:
                    file_name = file_info.file_name
                    if file_name in ['.', '..']:
                        continue
                    
                    full_path = f"{current_path}\\{file_name}"
                    
                    # 检查是否为文件
                    try:
                        time.sleep(SCAN_INTERVAL)
                        file_open = Open(tree, full_path)
                        file_open.create(
                            impersonation_level=0,
                            desired_access=0x00000001,
                            file_attributes=0,
                            share_access=ShareAccess.FILE_SHARE_READ,
                            create_disposition=3,
                            create_options=0
                        )
                        
                        is_file = not bool(file_open.file_attributes & 0x00000010)
                        file_open.close()
                        
                        if is_file:
                            # 提取文件类型
                            file_type = os.path.splitext(file_name)[1] if '.' in file_name else ''
                            file_list.append({
                                'file_path': full_path,
                                'file_name': file_name,
                                'file_type': file_type
                            })
                    except Exception as e:
                        logging.warning(f"检查文件 {full_path} 失败: {e}")
                
                open_file.close()
                return file_list
            
            open_file.close()
            return []
        except Exception as e:
            logging.warning(f"扫描文件夹 {current_path} 失败: {e}")
            return []
    
    def process_folder(self, tree, folder_path):
        """处理单个文件夹"""
        seat, capture_date, folder_id = self.parse_folder_path(folder_path)
        
        if not folder_id:
            return
        
        # 检查是否已经扫描过（避免重复处理）
        if self._is_already_scanned(folder_id):
            logging.info(f"文件夹 {folder_id} 已经扫描过，跳过")
            return
        
        # 扫描文件夹下的文件
        files = self.scan_folder(tree, folder_path)
        
        # 保存到数据库
        self.save_to_database(folder_id, seat, capture_date, files)
        
        logging.info(f"处理完成: ID={folder_id}, 席位={seat}, 日期={capture_date}, 文件数={len(files)}")
    
    def _is_already_scanned(self, folder_id):
        """检查文件夹是否已经扫描过"""
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT id FROM scan_records WHERE id = ?", (folder_id,))
            return cursor.fetchone() is not None
        finally:
            conn.close()
    
    def save_to_database(self, folder_id, seat, capture_date, files):
        """保存到数据库"""
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        try:
            # 检查记录是否已存在
            cursor.execute("SELECT id FROM scan_records WHERE id = ?", (folder_id,))
            if cursor.fetchone():
                # 更新记录
                cursor.execute("""
                    UPDATE scan_records 
                    SET seat = ?, capture_date = ?, scan_time = ?, total_files = ?
                    WHERE id = ?
                """, (seat, capture_date, datetime.now().isoformat(), len(files), folder_id))
                
                # 删除旧的文件记录
                cursor.execute("DELETE FROM file_records WHERE record_id = ?", (folder_id,))
            else:
                # 插入新记录
                cursor.execute("""
                    INSERT INTO scan_records (id, seat, capture_date, scan_time, total_files)
                    VALUES (?, ?, ?, ?, ?)
                """, (folder_id, seat, capture_date, datetime.now().isoformat(), len(files)))
            
            # 插入文件记录
            for file_info in files:
                cursor.execute("""
                    INSERT INTO file_records (record_id, file_path, file_name, file_type)
                    VALUES (?, ?, ?, ?)
                """, (folder_id, file_info['file_path'], file_info['file_name'], file_info['file_type']))
            
            conn.commit()
        except Exception as e:
            logging.error(f"数据库保存失败: {e}")
        finally:
            conn.close()
    
    def _process_batch(self, tree, current_path, file_batch):
        """批处理文件"""
        for file_info in file_batch:
            file_name = file_info.file_name
            full_path = f"{current_path}\\{file_name}"
            
            # 检查是否为ID文件夹（UUID格式）
            if '-' in file_name and len(file_name) >= 36:
                # 处理ID文件夹
                try:
                    self.process_folder(tree, full_path)
                except Exception as e:
                    logging.warning(f"处理文件夹 {full_path} 失败: {e}")
            else:
                # 递归搜索子目录
                try:
                    self.recursive_scan(tree, full_path)
                except Exception as e:
                    logging.warning(f"递归扫描 {full_path} 失败: {e}")
            
            # 添加处理间隔
            time.sleep(SCAN_INTERVAL)
    
    def recursive_scan(self, tree, current_path):
        """递归扫描文件夹"""
        try:
            # 添加扫描间隔，避免过快访问
            time.sleep(SCAN_INTERVAL)
            
            open_file = Open(tree, current_path)
            open_file.create(
                impersonation_level=0,
                desired_access=0x00000001,
                file_attributes=0,
                share_access=ShareAccess.FILE_SHARE_READ,
                create_disposition=3,
                create_options=0
            )
            
            is_directory = bool(open_file.file_attributes & 0x00000010)
            
            if is_directory:
                files = open_file.query_directory('*')
                
                # 分批处理文件
                file_batch = []
                for file_info in files:
                    file_name = file_info.file_name
                    if file_name in ['.', '..']:
                        continue
                    file_batch.append(file_info)
                    
                    # 达到批处理大小，进行处理
                    if len(file_batch) >= BATCH_SIZE:
                        self._process_batch(tree, current_path, file_batch)
                        file_batch = []
                
                # 处理剩余文件
                if file_batch:
                    self._process_batch(tree, current_path, file_batch)
            
            open_file.close()
        except Exception as e:
            logging.warning(f"扫描路径 {current_path} 失败: {e}")
    
    def run_scan(self):
        """运行扫描"""
        logging.info("开始扫描...")
        
        connection, session, tree = None, None, None
        
        try:
            connection, session, tree = self.connect_smb()
            
            # 从根路径开始扫描
            root_path = ROOT_PATH.replace('/', '\\')
            self.recursive_scan(tree, root_path)
            
            logging.info("扫描完成!")
            
        except Exception as e:
            logging.error(f"扫描失败: {e}")
        finally:
            if tree:
                try:
                    tree.disconnect()
                except:
                    pass
            if session:
                try:
                    session.disconnect()
                except:
                    pass
            if connection:
                try:
                    connection.disconnect()
                except:
                    pass
    
    def start_schedule(self):
        """启动定时任务"""
        # 每小时执行一次
        schedule.every().hour.do(self.run_scan)
        
        # 立即执行一次
        self.run_scan()
        
        logging.info("定时扫描任务已启动，每小时执行一次")
        
        while True:
            try:
                schedule.run_pending()
                time.sleep(60)
            except Exception as e:
                logging.error(f"定时任务错误: {e}")
                time.sleep(60)

def query_database():
    """查询数据库示例"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    logging.info("\n=== 数据库查询结果 ===")
    
    # 查询所有记录
    cursor.execute("SELECT * FROM scan_records LIMIT 10")
    records = cursor.fetchall()
    
    logging.info(f"\n扫描记录 ({len(records)} 条):")
    for record in records:
        logging.info(f"ID: {record['id']}, 席位: {record['seat']}, 日期: {record['capture_date']}, 文件数: {record['total_files']}")
    
    # 查询文件记录
    if records:
        record_id = records[0]['id']
        cursor.execute("SELECT * FROM file_records WHERE record_id = ? LIMIT 5", (record_id,))
        files = cursor.fetchall()
        
        logging.info(f"\n文件记录 (ID: {record_id}):")
        for file in files:
            logging.info(f"  文件名: {file['file_name']}, 类型: {file['file_type']}, 路径: {file['file_path']}")
    
    conn.close()

if __name__ == "__main__":
    scanner = FolderScanner()
    
    # 运行一次扫描
    scanner.run_scan()
    
    # 查询数据库
    query_database()
    
    # 启动定时任务
    # scanner.start_schedule()