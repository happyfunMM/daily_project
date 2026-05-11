"""
Batch Scan SMB Share
Incremental completion dataset.csv
"""
import os
import csv
import time
import threading
import queue
import smbclient
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Set, Dict, Optional
from datetime import datetime
import pandas as pd

class HighPerformanceSMBScanner:
    def __init__(self, server_ip, share_name, username, password, max_workers=20, max_queue_size=10000):
        self.server_ip = server_ip
        self.share_name = share_name
        self.username = username
        self.password = password
        self.max_workers = max_workers
        self.max_queue_size = max_queue_size
        
        # 状态管理
        self.scanned_folders: Set[str] = set()
        self.folder_lock = threading.Lock()
        self.total_files_count = 0
        self.count_lock = threading.Lock()
        self.csv_lock = threading.Lock()
        self.csv_file = None
        self.csv_writer = None
        
        # 任务队列（生产者-消费者模式）
        self.task_queue = queue.Queue(maxsize=max_queue_size)
        self.results_queue = queue.Queue()
        self.stop_event = threading.Event()
        
        # 建立全局会话
        smbclient.register_session(server_ip, username=username, password=password)
        print(f"✅ SMB会话已建立: {server_ip}")

    def scan_single_directory(self, target_path: str, output_csv: str, 
                              extensions: List[str] = None, read_error_log: bool = True):
        """
        扫描单个目标目录，查找所有log文件（包括子目录）
        
        Args:
            target_path: 目标目录路径
            output_csv: 输出CSV文件路径
            extensions: 要扫描的文件扩展名列表（默认 ['log']）
            read_error_log: 是否读取error.log文件内容
        """
        if extensions is None:
            extensions = ['log']
        
        root_smb_path = f"\\{self.server_ip}\{self.share_name}\{target_path}".replace('/', '\\')
        
        # 初始化 CSV 文件
        self.csv_file = open(output_csv, 'w', newline='', encoding='utf-8')
        self.csv_writer = csv.writer(self.csv_file)
        # 写入表头 - 包含error_content字段
        headers = ['directory', 'file_path', 'file_name', 'file_size', 
                  'modified_time', 'scan_time', 'is_error_log', 'error_content']
        self.csv_writer.writerow(headers)
        
        print(f"🚀 开始扫描目录: {root_smb_path}")
        print(f"🔍 查找扩展名: {extensions}")
        print(f"👷 并发线程数: {self.max_workers}")
        start_time = time.time()

        try:
            # 使用生产者-消费者模式
            # 1. 先收集所有子目录
            print("📂 正在收集目录结构...")
            all_dirs = self._collect_all_directories(root_smb_path)
            print(f"📁 发现 {len(all_dirs)} 个子目录")
            
            # 2. 使用线程池并发扫描所有目录
            print("🔍 开始并发扫描文件...")
            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                # 提交所有目录扫描任务
                future_to_dir = {
                    executor.submit(self._scan_directory_for_logs, dir_path, extensions, read_error_log): dir_path 
                    for dir_path in all_dirs
                }
                
                # 收集结果
                for future in as_completed(future_to_dir):
                    dir_path = future_to_dir[future]
                    try:
                        log_files = future.result()
                        if log_files:
                            for log_info in log_files:
                                self._write_log_to_csv(log_info)
                    except Exception as e:
                        print(f"❌ 扫描目录失败 {dir_path}: {e}")
                    
        except Exception as e:
            print(f"❌ 扫描出错: {e}")
        finally:
            if self.csv_file:
                self.csv_file.close()
            
            elapsed = time.time() - start_time
            print(f"\n✅ 扫描完成！")
            print(f"⏱️ 耗时: {elapsed:.2f} 秒")
            print(f"📂 扫描目录数: {len(self.scanned_folders)}")
            print(f"📄 发现文件数: {self.total_files_count}")
            if elapsed > 0:
                print(f"⚡ 平均速度: {self.total_files_count/elapsed:.2f} 文件/秒")
    
    def batch_scan_directories(self, target_paths: List[str], output_csv: str,
                              extensions: List[str] = None, read_error_log: bool = True,
                              batch_size: int = 1000):
        """
        批量扫描多个目标目录（适合9万个目录的场景）
        
        Args:
            target_paths: 目标目录路径列表
            output_csv: 输出CSV文件路径
            extensions: 要扫描的文件扩展名列表
            read_error_log: 是否读取error.log文件内容
            batch_size: 每批处理的目录数量
        """
        if extensions is None:
            extensions = ['log']
        
        total_dirs = len(target_paths)
        print(f"🚀 批量扫描启动")
        print(f"📊 目标目录总数: {total_dirs:,}")
        print(f"📦 批次大小: {batch_size}")
        print(f"👷 并发线程数: {self.max_workers}")
        
        # 初始化 CSV 文件
        self.csv_file = open(output_csv, 'w', newline='', encoding='utf-8')
        self.csv_writer = csv.writer(self.csv_file)
        headers = ['directory', 'file_path', 'file_name', 'file_size', 
                  'modified_time', 'scan_time', 'is_error_log', 'error_content']
        self.csv_writer.writerow(headers)
        
        total_start_time = time.time()
        processed_dirs = 0
        
        try:
            # 分批处理
            for batch_idx in range(0, total_dirs, batch_size):
                batch_start = time.time()
                batch_paths = target_paths[batch_idx:batch_idx + batch_size]
                batch_num = batch_idx // batch_size + 1
                total_batches = (total_dirs + batch_size - 1) // batch_size
                
                print(f"\n📦 处理批次 {batch_num}/{total_batches} ({len(batch_paths)} 个目录)")
                
                # 收集当前批次所有子目录
                all_dirs = []
                for target_path in batch_paths:
                    root_path = f"\\{self.server_ip}\{self.share_name}\{target_path}".replace('/', '\\')
                    try:
                        dirs = self._collect_all_directories(root_path)
                        all_dirs.extend(dirs)
                    except Exception as e:
                        print(f"⚠️ 收集目录失败 {target_path}: {e}")
                
                print(f"   📁 发现 {len(all_dirs)} 个子目录")
                
                # 并发扫描当前批次的所有目录
                with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                    future_to_dir = {
                        executor.submit(self._scan_directory_for_logs, dir_path, extensions, read_error_log): dir_path 
                        for dir_path in all_dirs
                    }
                    
                    for future in as_completed(future_to_dir):
                        dir_path = future_to_dir[future]
                        try:
                            log_files = future.result()
                            if log_files:
                                for log_info in log_files:
                                    self._write_log_to_csv(log_info)
                        except Exception as e:
                            print(f"   ❌ 扫描失败 {dir_path}: {e}")
                
                processed_dirs += len(batch_paths)
                batch_elapsed = time.time() - batch_start
                total_elapsed = time.time() - total_start_time
                progress = processed_dirs / total_dirs * 100
                
                print(f"   ✅ 批次完成，耗时: {batch_elapsed:.2f}秒")
                print(f"   📈 总进度: {processed_dirs:,}/{total_dirs:,} ({progress:.1f}%)")
                print(f"   ⏱️ 总耗时: {total_elapsed:.2f}秒")
                
                # 每10批刷新一次文件
                if batch_num % 10 == 0:
                    with self.csv_lock:
                        self.csv_file.flush()
                    
        except Exception as e:
            print(f"❌ 批量扫描出错: {e}")
        finally:
            if self.csv_file:
                self.csv_file.close()
            
            total_elapsed = time.time() - total_start_time
            print(f"\n✅ 批量扫描完成！")
            print(f"⏱️ 总耗时: {total_elapsed:.2f} 秒")
            print(f"📂 扫描目录数: {len(self.scanned_folders):,}")
            print(f"📄 发现log文件数: {self.total_files_count:,}")
            if total_elapsed > 0:
                print(f"⚡ 平均速度: {self.total_files_count/total_elapsed:.2f} 文件/秒")

    def _collect_all_directories(self, root_path: str, max_depth: int = 3) -> List[str]:
        """
        收集目录下的所有子目录（BFS广度优先，限制深度）
        
        Args:
            root_path: 根目录路径
            max_depth: 最大扫描深度
            
        Returns:
            所有目录路径列表
        """
        all_dirs = [root_path]
        current_level = [root_path]
        
        for depth in range(max_depth):
            next_level = []
            for dir_path in current_level:
                try:
                    with self.folder_lock:
                        if dir_path in self.scanned_folders:
                            continue
                        self.scanned_folders.add(dir_path)
                    
                    entries = smbclient.scandir(dir_path)
                    for entry in entries:
                        if entry.is_dir() and entry.name not in ['.', '..']:
                            sub_dir = os.path.join(dir_path, entry.name).replace('/', '\\')
                            all_dirs.append(sub_dir)
                            next_level.append(sub_dir)
                except Exception as e:
                    continue
            current_level = next_level
            if not current_level:
                break
        
        return all_dirs
    
    def _scan_directory_for_logs(self, dir_path: str, extensions: List[str], 
                                 read_error_log: bool) -> List[Dict]:
        """
        扫描单个目录中的log文件
        
        Args:
            dir_path: 目录路径
            extensions: 文件扩展名列表
            read_error_log: 是否读取error.log内容
            
        Returns:
            log文件信息列表
        """
        log_files = []
        
        try:
            entries = smbclient.scandir(dir_path)
            for entry in entries:
                if not entry.is_file():
                    continue
                
                # 检查扩展名
                file_ext = entry.name.split('.')[-1].lower() if '.' in entry.name else ''
                if file_ext not in extensions:
                    continue
                
                entry_path = os.path.join(dir_path, entry.name).replace('/', '\\')
                
                try:
                    stat_info = smbclient.stat(entry_path)
                    
                    # 构建文件信息
                    log_info = {
                        'directory': dir_path,
                        'file_path': entry_path,
                        'file_name': entry.name,
                        'file_size': stat_info.st_size,
                        'modified_time': datetime.fromtimestamp(stat_info.st_mtime).strftime('%Y-%m-%d %H:%M:%S'),
                        'scan_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                        'is_error_log': 'error' in entry.name.lower(),
                        'error_content': ''
                    }
                    
                    # 如果是error.log且需要读取内容
                    if read_error_log and log_info['is_error_log']:
                        try:
                            # 读取文件内容（限制大小，避免内存溢出）
                            with smbclient.open_file(entry_path, 'r', encoding='utf-8', errors='ignore') as f:
                                # 只读取前10KB内容
                                content = f.read(10240)
                                log_info['error_content'] = content[:1000]  # 只保存前1000字符
                        except Exception as e:
                            log_info['error_content'] = f"[读取失败: {str(e)}]"
                    
                    log_files.append(log_info)
                    
                    with self.count_lock:
                        self.total_files_count += 1
                    
                except Exception:
                    continue
                    
        except Exception as e:
            pass  # 忽略无法访问的目录
        
        return log_files

    def _write_log_to_csv(self, log_info: Dict):
        """
        线程安全的 CSV 写入（流式，不占内存）
        """
        with self.csv_lock:
            self.csv_writer.writerow([
                log_info['directory'],
                log_info['file_path'],
                log_info['file_name'],
                log_info['file_size'],
                log_info['modified_time'],
                log_info['scan_time'],
                log_info['is_error_log'],
                log_info['error_content']
            ])
    
    def _write_to_csv_stream(self, path, f_type, size, mtime):
        """
        线程安全的 CSV 写入（流式，不占内存）- 兼容旧版本
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
    # 场景1: 扫描单个目录
    print("="*60)
    print("场景1: 扫描单个目录")
    print("="*60)
    
    scanner = HighPerformanceSMBScanner(
        server_ip="10.128.0.30", 
        share_name="data_common", 
        username="daisy", 
        password="daisy@2026",
        max_workers=20
    )
    
    # 扫描单个目录，查找所有log文件，读取error.log内容
    scanner.scan_single_directory(
        target_path="viz_check/assets/meshes_chip", 
        output_csv="itf_items.csv",
        extensions=['fbx', 'stl'],
        read_error_log=False
    )
    
    # 场景2: 批量扫描9万个目录（从文件读取目录列表）
    # print("\n" + "="*60)
    # print("场景2: 批量扫描9万个目录")
    # print("="*60)
    # 
    # 假设目录列表存储在文件中，每行一个目录路径
    # 例如: customers/yhty-20260319, customers/abc-20260101, ...
    # dataset = pd.read_csv(r"C:\Users\chopi\My_Data\itf_dataset.csv", low_memory=False)
    # target_paths = dataset['src_path'].tolist()
    # with open("target_directories.txt", "w", encoding="utf-8") as f:
        # for path in target_paths:
            # f.write(path + "\n")
    
    # def load_target_directories(file_path: str) -> List[str]:
        # """从文件加载目标目录列表"""
        # with open(file_path, 'r', encoding='utf-8') as f:
            # return [line.strip() for line in f if line.strip()]
    
    # 示例: 加载9万个目录
    # target_paths = load_target_directories("target_directories.txt")
    
    # 或者生成示例目录列表（实际使用时从文件读取）
    # target_paths = [f"customers/target-{i:05d}" for i in range(90000)]
    
    # batch_scanner = HighPerformanceSMBScanner(
        # server_ip="10.128.0.30",
        # share_name="itf",
        # username="daisy",
        # password="daisy@2026",
        # max_workers=50,  # 针对大批量扫描，使用更多线程
        # max_queue_size=50000
    # )
    
    # 批量扫描，每批处理1000个目录
    # batch_scanner.batch_scan_directories(
        # target_paths=target_paths[:100],  # 实际使用时去掉切片，扫描全部
        # output_csv="batch_scan_results.csv",
        # extensions=['log'],  # 扫描log和txt文件
        # read_error_log=True,  # 读取error.log内容
        # batch_size=1000
    # )
    # 
    # 场景3: 增量发现新目录并补充到目录名单
    # print("\n" + "="*60)
    # print("场景3: 增量发现新目录")
    # print("="*60)
    # 
    # 假设我们有一个现有的目录名单文件
    # directory_list_file = "target_directories.txt"
    # 
    # 创建发现器
    # discover_scanner = HighPerformanceSMBScanner(
        # server_ip="10.128.0.30",
        # share_name="itf",
        # username="daisy",
        # password="daisy@2026"
    # )
    # 
    # 发现新目录并追加到目录名单
    # 扫描 "customers" 目录下所有2层深度的子目录
    # new_dirs = discover_scanner.discover_new_directories(
        # target_path="customers",
        # existing_list_file=directory_list_file,
        # output_list_file=directory_list_file,  # 追加到原文件
        # max_depth=2  # 扫描深度为2层
    # )
    # 
    # 如果发现了新目录，可以选择立即扫描它们
    # if new_dirs:
        # print(f"\n🔍 开始扫描 {len(new_dirs)} 个新发现的目录...")
        # discover_scanner.batch_scan_directories(
            # target_paths=new_dirs,
            # output_csv="new_dirs_scan_results.csv",
            # extensions=['log'],
            # read_error_log=True,
            # batch_size=100
        # )
    # 