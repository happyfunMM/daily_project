## ITF 银河通用扫盘

import os
import csv
import time
import uuid
from typing import List, Dict, Any
from smbprotocol.connection import Connection
from smbprotocol.session import Session
from smbprotocol.tree import TreeConnect
from smbprotocol.open import Open, ShareAccess
from smbprotocol.file_info import FileInformationClass

# Default SMB connection settings
DEFAULT_SERVER_IP = '10.128.0.30'      # 目标服务器IP
DEFAULT_SHARE_NAME = 'itf'           # 共享文件夹名称
DEFAULT_USERNAME = 'daisy'
DEFAULT_PASSWORD = 'daisy@2026'

class FolderScanner:
    """
    A class to scan folders and files, with depth control, batch processing, and SMB support.
    """
    
    def __init__(self, server_ip=DEFAULT_SERVER_IP, share_name=DEFAULT_SHARE_NAME, 
                 username=DEFAULT_USERNAME, password=DEFAULT_PASSWORD):
        """
        Initialize the FolderScanner with SMB connection parameters.
        
        Args:
            server_ip (str): The SMB server IP address.
            share_name (str): The SMB share name.
            username (str): The SMB username.
            password (str): The SMB password.
        """
        self.scanned_items = []
        self.server_ip = server_ip
        self.share_name = share_name
        self.username = username
        self.password = password
    
    def connect_smb(self):
        """
        Establish SMB connection.
        
        Returns:
            tuple: (connection, session, tree)
        """
        connection = Connection(uuid.uuid4(), self.server_ip, 445)
        connection.connect()
        
        session = Session(connection, self.username, self.password)
        session.connect()
        
        tree = TreeConnect(session, f"\\\\{self.server_ip}\\{self.share_name}")
        tree.connect()
        
        return connection, session, tree
    
    def scan(self, path: str, current_depth: int = 0, smb_connect = True,extensions: List[str] = None) -> List[Dict[str, Any]]:
        """
        Scan a path to determine if it's a file or folder, recursively scan folders,
        and stop scanning when folder depth exceeds 6 levels.
        
        Args:
            path (str): The path to scan.
            current_depth (int): The current depth of the scan.
            extensions (List[str]): List of file extensions to include (e.g., ['txt', 'jpg']).
                                   If None, all files are included.
            
        Returns:
            List[Dict[str, Any]]: A list of scanned items with their details.
        """
        # Reset scanned items for new scan
        self.scanned_items = []
        
        # Check if path is a local path or SMB path
        if smb_connect:
            # SMB path
            connection, session, tree = None, None, None
            try:
                connection, session, tree = self.connect_smb()
                self._scan_smb_recursive(tree, path, current_depth, extensions)
            except Exception as e:
                print(f"Error scanning SMB path {path}: {e}")
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
        else:
            # Local path
            self._scan_local_recursive(path, current_depth, extensions)
        
        return self.scanned_items
    
    def _scan_local_recursive(self, path: str, current_depth: int, extensions: List[str] = None):
        """
        Recursively scan a local path.
        
        Args:
            path (str): The local path to scan.
            current_depth (int): The current depth of the scan.
            extensions (List[str]): List of file extensions to include.
        """
        # Check if depth limit is exceeded
        if current_depth > 6:
            return
        
        try:
            # Check if path exists
            if not os.path.exists(path):
                return
            
            # Check if it's a file and filter by extension if specified
            if os.path.isfile(path) and extensions:
                file_ext = os.path.splitext(path)[1].lower()
                if file_ext not in extensions:
                    return
            
            # Get item details
            item = {
                'path': path,
                'root': os.path.dirname(path),
                'basename': os.path.basename(path),
                'type': 'file' if os.path.isfile(path) else 'folder',
                'scan_time': time.strftime('%Y-%m-%d %H:%M:%S')
            }
            
            # Add to scanned items
            self.scanned_items.append(item)
            
            # Recursively scan folders if depth limit not exceeded
            if os.path.isdir(path) and current_depth < 6:
                for item_name in os.listdir(path):
                    item_path = os.path.join(path, item_name)
                    self._scan_local_recursive(item_path, current_depth + 1, extensions)
                    
        except Exception as e:
            logging.error(f"Error scanning local path {path}: {e}")
    
    def _scan_smb_recursive(self, tree, path: str, current_depth: int, extensions: List[str] = None):
        """
        Recursively scan an SMB path.
        
        Args:
            tree: The SMB tree connection.
            path (str): The SMB path to scan.
            current_depth (int): The current depth of the scan.
            extensions (List[str]): List of file extensions to include.
        """
        # Check if depth limit is exceeded
        if current_depth > 6:
            return
        
        try:
            # Open the path
            open_file = Open(tree, path)
            open_file.create(
                impersonation_level=0,
                desired_access=0x00000001,
                file_attributes=0,
                share_access=ShareAccess.FILE_SHARE_READ,
                create_disposition=3,
                create_options=0
            )
            
            # # Check if it's a directory
            is_directory = bool(open_file.file_attributes & 0x00000010)
            
            # Check if it's a file and filter by extension if specified
            if not is_directory:
                if extensions:
                    file_ext = os.path.basename(path).split('.')[-1].lower() if '.' in os.path.basename(path) else ''
                    if file_ext not in extensions:
                        open_file.close()
                        return
                    else:
                        # Get item details
                        item = {
                            'path': path,
                            'root': os.path.dirname(path),
                            'basename': os.path.basename(path),
                            'type': 'file' if not is_directory else 'folder',
                            'scan_time': time.strftime('%Y-%m-%d %H:%M:%S')
                        }
                        
                        # Add to scanned items
                        self.scanned_items.append(item)
            else:
                # Recursively scan folders if depth limit not exceeded
                if current_depth < 6:
                    files = open_file.query_directory('', file_information_class=FileInformationClass.FILE_DIRECTORY_INFORMATION)
                    
                    for file_info in files:
                        file_name = file_info['file_name'].get_value().decode('UTF-16-LE')
                        if file_name in ['.', '..']:
                            continue
                        item_path = f"{path}\\{file_name}"
                        self._scan_smb_recursive(tree, item_path, current_depth + 1, extensions)
            
            open_file.close()
                    
        except Exception as e:
            logging.error(f"Error scanning SMB path {path}: {e}")
    
    def write_to_csv(self, csv_path: str, items: List[Dict[str, Any]]):
        """
        Write scanned files or folders to a CSV file.
        
        Args:
            csv_path (str): The path to the CSV file.
            items (List[Dict[str, Any]]): The list of scanned items to write.
        """
        if not items:
            return
        
        # Define CSV headers
        headers = ['path', 'root', 'basename', 'type', 'scan_time']
        
        try:
            with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=headers)
                writer.writeheader()
                writer.writerows(items)
            print(f"Successfully wrote {len(items)} items to {csv_path}")
        except Exception as e:
            logging.error(f"Error writing to CSV: {e}")
    
    def batch_scan(self, paths: List[str], batch_size: int = 100, extensions: List[str] = None):
        """
        Process scans in batches.
        
        Args:
            paths (List[str]): List of paths to scan.
            batch_size (int): The size of each batch.
            extensions (List[str]): List of file extensions to include.
            
        Returns:
            List[Dict[str, Any]]: A list of all scanned items.
        """
        all_scanned_items = []
        
        # Process paths in batches
        for i in range(0, len(paths), batch_size):
            batch_paths = paths[i:i + batch_size]
            batch_results = []
            
            for path in batch_paths:
                batch_results.extend(self.scan(path, extensions=extensions))
            
            all_scanned_items.extend(batch_results)
            print(f"Processed batch {i // batch_size + 1}/{(len(paths) + batch_size - 1) // batch_size}")
        
        return all_scanned_items

import time
# Example usage
if __name__ == "__main__":
    scanner = FolderScanner()
    
    # # Example 1: Scan a single path with all files
    # print("Scanning a single path (all files)...")
    # scanned_items = scanner.scan("c:\\Users\\chopi\\My_Project")
    # print(f"Scanned {len(scanned_items)} items")
    
    # # Example 2: Scan with specific extensions
    # print("\nScanning with specific extensions (.txt, .py)...")
    # txt_py_items = scanner.scan("c:\\Users\\chopi\\My_Project", extensions=['txt', 'py'])
    # print(f"Scanned {len(txt_py_items)} text and Python files")
    
    # # Example 3: Write to CSV
    # print("\nWriting to CSV...")
    # scanner.write_to_csv("scan_results.csv", scanned_items)
    
    # # Example 4: Batch scan with extensions
    # print("\nBatch scanning multiple paths with extensions...")
    # paths_to_scan = ["c:\\Users\\chopi\\My_Project"]
    # batch_results = scanner.batch_scan(paths_to_scan, batch_size=10, extensions=['txt', 'py', 'csv'])
    # print(f"Batch scan completed. Total items: {len(batch_results)}")
    
    # Example 5: SMB scan with extensions
    print("\nScanning SMB path with extensions...")
    smb_scanner = FolderScanner(
        server_ip='10.128.0.30',
        share_name='itf',
        username='daisy',
        password='daisy@2026'
    )
    start = time.time()
    smb_results = smb_scanner.scan(r"customers\yhty-20260319", extensions=['log'])
    end = time.time()
    print("耗时: {:.2f}秒".format(end - start))
    print(f"SMB scan completed. Total items: {len(smb_results)}")
    smb_scanner.write_to_csv("smb_scan_results.csv", smb_results)