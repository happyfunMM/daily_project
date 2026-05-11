import pandas as pd
import numpy as np

# 读取数据集
itf_datasets = pd.read_csv(r"C:\Users\chopi\My_Data\itf_dataset_with_track.csv".replace('\\','/'), low_memory = False)
with_items = itf_datasets[(itf_datasets['track'] != 0.00)&(~itf_datasets['track'].isnull())&(~itf_datasets['duration'].isnull())&(itf_datasets['status'] == 1)].reset_index(drop=True)

# 配置参数
total_duration = 36000  # 总目标duration
print(f"总目标duration: {total_duration}")

def split_datasets(datasets = datasets, total_duration = total_duration, selected_indices = selected_indices):
    # 按task_name分组
    groups = datasets.groupby('task_name')
    
    # 存储选择的数据
    selected_data = []
    remaining_duration = total_duration - datasets.loc[selected_indices]['duration'].sum()
    print(f"剩余目标duration: {remaining_duration:.2f}")

    # 处理未处理的类别
    for task_name, group in groups:
        if remaining_duration <= 0:
            break
        # 按自然顺序选择到目标duration
        cumulative = 0
        for i, row in group.iterrows():
            if i not in selected_indices:
                cumulative += row['duration']
                selected_indices.append(i)
            if cumulative >= current_target_per_class:
                break
        remaining_duration = remaining_duration - cumulative
        print(f"处理类别: {task_name}")
        print(f"剩余duration: {remaining_duration:.2f}")
        
    return selected_indices, remaining_duration

# 迭代处理直到达到目标
selected_indices = []
remaining_duration = total_duration
while remaining_duration > 0 and len(selected_indices) <= len(with_items):
    iteration += 1
    print(f"\n迭代 {iteration}:")
    # selected_indices = []
    selected_indices, remaining_duration = split_datasets(datasets = with_items, total_duration = total_duration,selected_indices = selected_indices)

final_data = with_items.loc[selected_indices]
actual_total_duration = final_data['duration'].sum()
# 输出结果
print(f"\n最终结果:")
print(f"  总数据量: {len(final_data)}")
print(f"  总duration: {actual_total_duration:.2f}")
print(f"  类别数量: {len(final_data['task_name'].unique())}")
print(f"  各类别达标情况: {actual_total_duration / total_duration * 100:.2f}%")

# 保存结果
final_data.to_csv(r"C:\Users\chopi\My_Data\selected_dataset.csv".replace('\\','/'), index=False)
print("\n结果已保存到 selected_dataset.csv")

# 查看每类的duration
print("\n每类duration统计:")
class_stats = final_data.groupby('task_name').agg({'duration': ['sum', 'count']})
for task_name in class_stats.index:
    dur_sum = class_stats.loc[task_name, ('duration', 'sum')]
    count = class_stats.loc[task_name, ('duration', 'count')]
    print(f"  {task_name}: {dur_sum:.2f} ({count}条)")

# 验证是否达到目标
if actual_total_duration >= total_duration * 0.99 and actual_total_duration <= total_duration * 1.01:
    print("\n✓ 成功达到目标duration")
else:
    print("\n⚠ 未达到目标duration范围")
