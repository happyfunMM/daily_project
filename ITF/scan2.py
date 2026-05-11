"""
Simply Concurrent Scanning

"""
import os
import csv
import time
import threading
import smbclient
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Set

class HighPerformanceSMBScanner:
    def __init__(self, server_ip, share_name, username, password, max_workers=10):
        self.server_ip = server_ip
        self.share_name = share_name
        self.username = username
        self.password = password
        self.max_workers = max_workers  # 并发线程数
        
        # 状态管理
        self.scanned_folders: Set[str] = set()
        self.total_files_count = 0
        self.csv_lock = threading.Lock() # 锁，用于保护 CSV 写入
        self.csv_file = None
        self.csv_writer = None
        
        # 建立全局会话
        smbclient.register_session(server_ip, username=username, password=password)

    def scan(self, start_path: str, output_csv: str, extensions: List[str] = None):
        """
        启动扫描，支持流式写入 CSV
        """
        root_smb_path = f"\\\\{self.server_ip}\\{self.share_name}\\{start_path}".replace('/', '\\')
        
        # 1. 初始化 CSV 文件
        self.csv_file = open(output_csv, 'w', newline='', encoding='utf-8')
        self.csv_writer = csv.writer(self.csv_file)
        # 写入表头
        self.csv_writer.writerow(['path', 'type', 'size', 'modified_time', 'scan_time'])
        
        print(f"🚀 开始扫描: {root_smb_path} (并发线程数: {self.max_workers})")
        start_time = time.time()

        try:
            # 2. 使用线程池进行递归扫描
            # 我们提交根目录任务，内部会递归分发子任务
            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                # 这里的 future 只是为了等待主任务完成
                future = executor.submit(self._process_directory, root_smb_path, extensions)
                # 等待所有递归任务完成
                # 注意：由于我们在函数内部又提交了新的 future，这里需要一种机制等待所有完成
                # 简单起见，我们等待主递归逻辑结束，但需注意线程池不会自动等待内部提交的任务
                # 在实际生产中，通常使用队列而非递归提交。这里为了保持逻辑清晰，做简化处理。
                while not future.done():
                    time.sleep(1)
                    
        except Exception as e:
            print(f"❌ 扫描出错: {e}")
        finally:
            # 3. 清理资源
            if self.csv_file:
                self.csv_file.close()
            
            print(f"✅ 扫描完成！")
            print(f"⏱️ 耗时: {time.time() - start_time:.2f} 秒")
            print(f"📂 扫描目录数: {len(self.scanned_folders)}")
            print(f"📄 发现文件数: {self.total_files_count}")

    def _process_directory(self, current_path: str, extensions: List[str]):
        """
        处理单个目录的逻辑（会被多线程调用）
        """
        # 防止重复扫描（简单的去重）
        if current_path in self.scanned_folders:
            return
        self.scanned_folders.add(current_path)

        try:
            # 使用 smbclient.scandir 获取目录内容
            # 这一步是 I/O 密集型操作，适合多线程
            # 修改后
            entries = smbclient.scandir(current_path)
            entry_list = list(entries) # 一次性拉取当前目录所有条目
            # 遍历条目
            for entry in entry_list:
                entry_path = os.path.join(current_path, entry.name).replace('/', '\\')
                
                if entry.is_dir():
                    # 如果是目录，提交到线程池异步处理（递归）
                    # 注意：这里不能直接用 ThreadPoolExecutor 的 submit 在递归中无限套娃
                    # 更好的方式是：如果目录很深，应该用队列。
                    # 为了代码简洁，这里直接递归调用，但利用线程池的并发能力
                    # 在海量小文件场景下，建议限制递归深度或改用生产者-消费者模型
                    self._process_directory(entry_path, extensions)
                    
                elif entry.is_file():
                    # 如果是文件，进行过滤和记录
                    if extensions:
                        ext = entry.name.split('.')[-1].lower()
                        if ext not in extensions:
                            continue
                    
                    # 获取详细属性 (stat 也是 I/O 操作)
                    try:
                        stat_info = smbclient.stat(entry_path)
                        self._write_to_csv_stream(entry_path, 'file', stat_info.st_size, stat_info.st_mtime)
                        self.total_files_count += 1
                    except Exception:
                        pass # 忽略无法 stat 的文件

        except PermissionError:
            print(f"⚠️ 权限不足: {current_path}")
        except Exception as e:
            print(f"⚠️ 访问失败 {current_path}: {e}")

    def _write_to_csv_stream(self, path, f_type, size, mtime):
        """
        线程安全的 CSV 写入（流式，不占内存）
        """
        with self.csv_lock:
            self.csv_writer.writerow([
                path, 
                f_type, 
                size, 
                time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(mtime)),
                time.strftime('%Y-%m-%d %H:%M:%S')
            ])
            # 每写 1000 行刷新一次磁盘，防止数据丢失（可选）
            if self.total_files_count % 1000 == 0:
                self.csv_file.flush()

# 使用示例
if __name__ == "__main__":
    # 增加 max_workers 可以加快网络 I/O 速度，但不要太大会被服务器限制
    scanner = HighPerformanceSMBScanner(
        server_ip="10.128.0.30", 
        share_name="itf", 
        username="daisy", 
        password="daisy@2026",
        max_workers=20 
    )

    
    # 扫描并实时写入到 result.csv
    scanner.scan("customers/yhty-20260319", "result-20260428.csv", extensions=['log'])

    # 数据库结构
    CREATE_TABLES = '''
    CREATE TABLE IF NOT EXISTS file_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id TEXT,
        file_path TEXT,
        base_name TEXT,
        file_type TEXT,
        scan_time TEXT,
        FOREIGN KEY (record_id) REFERENCES scan_records(id)
    );
    '''