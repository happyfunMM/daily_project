#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文件重命名脚本
功能：将指定目录下的所有文件按照固定格式重命名并添加递增后缀
"""

import os
import argparse

def rename_files(directory, prefix="file", start_number=1):
    """
    重命名指定目录下的所有文件
    
    Args:
        directory (str): 要处理的目录路径
        prefix (str): 文件名前缀
        start_number (int): 起始编号
    """
    # 检查目录是否存在
    if not os.path.exists(directory):
        print(f"错误：目录 '{directory}' 不存在")
        return
    
    # 检查目录是否为空
    file_list = [f for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f))]
    if not file_list:
        print(f"警告：目录 '{directory}' 为空")
        return
    
    # 排序文件列表，确保重命名顺序一致
    file_list.sort()
    
    # 开始重命名
    current_number = start_number
    for filename in file_list:
        # 获取文件扩展名
        _, ext = os.path.splitext(filename)
        if ext == '.mkv':
            # 构建新文件名
            new_filename = f"{prefix}_{current_number:04d}{ext}"
            
            # 构建完整路径
            old_path = os.path.join(directory, filename)
            new_path = os.path.join(directory, new_filename)
            
            # 检查新文件名是否已存在
            if os.path.exists(new_path):
                print(f"警告：文件 '{new_filename}' 已存在，跳过重命名 '{filename}'")
                continue
            
            try:
                # 执行重命名
                os.rename(old_path, new_path)
                print(f"已重命名: {filename} -> {new_filename}")
                current_number += 1
            except Exception as e:
                print(f"错误：重命名 '{filename}' 时发生错误: {str(e)}")

if __name__ == "__main__":
    # 解析命令行参数
    parser = argparse.ArgumentParser(description="文件重命名工具")
    parser.add_argument("directory", help="要处理的目录路径")
    parser.add_argument("--prefix", default="file", help="文件名前缀（默认：file）")
    parser.add_argument("--start", type=int, default=1, help="起始编号（默认：1）")
    
    args = parser.parse_args()
    
    # 调用重命名函数
    rename_files(args.directory, args.prefix, args.start)