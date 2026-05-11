#!/usr/bin/env python3
"""
SMB文件打包脚本（shutil版本）
使用shutil.copy2直接复制文件，shutil.make_archive直接打包目录

使用方法:
    python smb_copy_shutil.py --csv <csv文件> --output <输出zip>
                              --server <服务器> --share <共享名>
                              --username <用户名> --password <密码>

示例:
    python smb_copy_shutil.py --csv itf_modality_items.csv --output files.zip \
                              --server 10.128.0.30 --share data_common \
                              --username daisy --password daisy@2026
"""

import argparse
import csv
import os
import logging
import tempfile
import shutil
import subprocess

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def setup_smb_credentials(server, share, username, password, domain=''):
    """
    使用net use设置SMB凭据（不挂载驱动器）
    :param server: SMB服务器地址
    :param share: 共享名称
    :param username: 用户名
    :param password: 密码
    :param domain: 域（可选）
    :return: 是否成功
    """
    try:
        # 构建UNC路径
        unc_path = f"\\\\{server}\\{share}"
        
        # 先尝试清理可能存在的连接
        cmd_clean = f'net use {unc_path} /delete /y'
        subprocess.run(cmd_clean, shell=True, capture_output=True, text=True, encoding='gbk', errors='ignore')
        
        # 设置凭据
        if domain:
            cmd = f'net use {unc_path} {password} /user:{domain}\\{username} /persistent:no'
        else:
            cmd = f'net use {unc_path} {password} /user:{username} /persistent:no'
        
        logger.debug(f"设置SMB凭据: {cmd}")
        
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            encoding='gbk',
            errors='ignore'
        )
        
        if result.returncode == 0:
            logger.info(f"SMB凭据设置成功: {unc_path}")
            return True
        else:
            logger.warning(f"SMB凭据设置警告: {result.stderr}")
            # 即使设置凭据失败，也尝试继续（可能已有凭据）
            return True
    
    except Exception as e:
        logger.error(f"设置SMB凭据时发生异常: {str(e)}")
        return False


def copy_file_from_smb(remote_path, temp_root):
    """
    使用shutil.copy2复制文件到临时目录（保持目录结构）
    :param server: SMB服务器地址
    :param share: 共享名称
    :param remote_path: 远程文件路径
    :param temp_root: 临时目录根路径
    :return: 是否成功
    """
    try:
        # 构建UNC路径
        unc_path = f"\\{remote_path.replace('/', '\\')}"
    
        
        # 构建本地路径（保持原始目录结构）
        local_path = os.path.join(temp_root, os.path.basename(unc_path))
        print(f"从{unc_path}复制到{local_path}")
        
        # 确保本地目录存在
        local_dir = os.path.dirname(local_path)
        os.makedirs(local_dir, exist_ok=True)
        
        # 使用shutil.copy2复制文件（保留元数据）
        shutil.copy2(unc_path, local_path)
        
        logger.info(f"复制成功: {remote_path}")
        return True
    
    except FileNotFoundError:
        logger.warning(f"文件不存在: {unc_path}")
        return False
    except PermissionError:
        logger.error(f"权限不足: {unc_path}")
        return False
    except Exception as e:
        logger.error(f"复制文件失败 {remote_path}: {str(e)}")
        return False


def main():
    parser = argparse.ArgumentParser(description='SMB文件打包（shutil版本）')
    parser.add_argument('--csv', required=True, help='CSV文件路径')
    parser.add_argument('--output', required=True, help='输出ZIP文件路径')
    parser.add_argument('--server', required=True, help='SMB服务器地址')
    parser.add_argument('--share', required=True, help='SMB共享名称')
    parser.add_argument('--username', required=True, help='SMB用户名')
    parser.add_argument('--password', required=True, help='SMB密码')
    parser.add_argument('--domain', default='', help='SMB域（可选）')
    parser.add_argument('--path-column', default='path', help='CSV中路径列名称')
    parser.add_argument('--filter-type', default=None, help='过滤类型（如file）')
    parser.add_argument('--temp-dir', default=None, help='临时目录')
    parser.add_argument('--keep-temp', action='store_true', help='保留临时目录')
    
    args = parser.parse_args()
    
    # 检查CSV文件
    if not os.path.exists(args.csv):
        logger.error(f"CSV文件不存在: {args.csv}")
        return
    
    # 设置SMB凭据
    setup_smb_credentials(
        server=args.server,
        share=args.share,
        username=args.username,
        password=args.password,
        domain=args.domain
    )
    
    # 创建临时目录
    if args.temp_dir:
        temp_root = os.path.abspath(args.temp_dir)
        os.makedirs(temp_root, exist_ok=True)
        logger.info(f"使用临时目录: {temp_root}")
    else:
        temp_root = tempfile.mkdtemp(prefix='smb_shutil_')
        logger.info(f"创建临时目录: {temp_root}")
    
    success_count = 0
    fail_count = 0
    
    # 读取CSV并复制文件到临时目录
    logger.info("开始复制文件到临时目录...")
    with open(args.csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        if args.path_column not in reader.fieldnames:
            logger.error(f"CSV中不存在列: {args.path_column}")
            return
        
        for row in reader:
            # 过滤类型
            if args.filter_type and row.get('type') != args.filter_type:
                continue
            
            remote_path = row[args.path_column].strip()
            if not remote_path:
                continue
            
            # 使用shutil.copy2复制文件到临时目录
            if copy_file_from_smb(
                remote_path=remote_path,
                temp_root=temp_root
            ):
                success_count += 1
            else:
                fail_count += 1
    
    logger.info(f"复制完成！成功: {success_count}, 失败: {fail_count}")
    
    # 检查是否有文件需要打包
    if success_count == 0:
        logger.warning("没有成功复制任何文件，跳过打包")
        return
    
    # 直接打包整个临时目录（保留目录结构）
    logger.info(f"开始打包临时目录到ZIP...")
    
    # 获取输出目录和文件名
    output_dir = args.output
    
    # 使用shutil.make_archive直接打包目录
    # format='zip'表示输出ZIP格式
    # root_dir=temp_root表示要打包的目录
    # base_dir='.'表示从当前目录开始打包（保持完整结构）
    archive_path = shutil.make_archive(
        output_dir,
        'zip',
        root_dir=temp_root,
        base_dir='.'
    )
    
    # 检查是否需要重命名（make_archive会自动添加.zip扩展名）
    if archive_path != args.output:
        os.rename(archive_path, args.output)
    
    zip_size = os.path.getsize(args.output)
    logger.info(f"打包完成！ZIP文件: {os.path.abspath(args.output)} ({zip_size / (1024*1024):.2f} MB)")
    
    # 清理临时目录
    # if not args.keep_temp:
        # shutil.rmtree(temp_root, ignore_errors=True)
        # logger.info(f"已清理临时目录: {temp_root}")
    # else:
        # logger.info(f"保留临时目录: {temp_root}")


if __name__ == '__main__':
    main()