import csv
import json

def extract_key_info(csv_file_path, json_output_path, csv_output_path):
    """
    读取CSV文件并提取关键信息：task_name, tags, steps, duration, src_path，然后保存为JSON和CSV文件
    src_path中的所有'-'字符会被删除
    """
    extracted_data = []
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            # 遍历每一行数据
            for row in reader:
                # 提取src_path并删除所有'-'字符
                src_path = row.get('src_path', 'N/A')
                processed_src_path = src_path.replace('-', '')
                
                # 提取指定字段
                task_info = {
                    'task_name': row.get('task_name', 'N/A'),
                    'tags': row.get('tags', 'N/A'),
                    'steps': row.get('steps', 'N/A'),
                    'duration': row.get('duration', 'N/A'),
                    'src_path': processed_src_path  # 使用处理后的src_path
                }
                extracted_data.append(task_info)
        
        # 将提取的数据保存为JSON文件
        with open(json_output_path, 'w', encoding='utf-8') as json_file:
            json.dump(extracted_data, json_file, ensure_ascii=False, indent=2)
        
        # 将提取的数据保存为CSV文件（第二种格式）
        if extracted_data:
            # 获取字段名
            fieldnames = extracted_data[0].keys()
            with open(csv_output_path, 'w', newline='', encoding='utf-8') as csv_file:
                writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(extracted_data)
        
        print(f"成功提取信息并保存到:")
        print(f"JSON文件: {json_output_path}")
        print(f"CSV文件: {csv_output_path}")
        print(f"共提取 {len(extracted_data)} 条记录")
        
    except FileNotFoundError:
        print(f"错误：文件 '{csv_file_path}' 未找到")
    except Exception as e:
        print(f"错误：{e}")

if __name__ == "__main__":
    # CSV文件路径
    csv_path = r'C:\Users\chopi\My_Project\ITF\dataset.csv'
    # JSON输出文件路径
    json_output = r'C:\Users\chopi\My_Project\ITF\dataset_info.json'
    # CSV输出文件路径（第二种格式）
    csv_output = r'C:\Users\chopi\My_Project\ITF\dataset_info.csv'
    extract_key_info(csv_path, json_output, csv_output)