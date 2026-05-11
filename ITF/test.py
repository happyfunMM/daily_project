import json
import os 
import pandas as pd
path = r"C:\Users\chopi\My_Data\ITF"
file_list = os.listdir(path)
name = []
tags = []
items = []
duration = []
for fd in file_list:
    with open(os.path.join(path, fd, 'task_info.json'), 'r', encoding = 'utf-8') as f:
        test = json.load(f)
    name.append(test['name'])
    tags.append(test['tags'])
    items.append(test['items'])
    duration.append(test['duration'])
pd.DataFrame({'name': name, 'tags': tags, 'items': items, 'duration': duration}).to_csv(f'{path}\\task_info.csv', index=False, encoding='utf-8-sig')
