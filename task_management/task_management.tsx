// 代码已包含 CSS：使用 TailwindCSS , 安装 TailwindCSS 后方可看到布局样式效果
import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import * as echarts from 'echarts';
const swiperModules = [Pagination, Autoplay];
interface Column {
key: string;
title: string;
visible: boolean;
}
interface SearchTerms {
name: string;
modelDescription: string;
caseDescription: string;
caseName: string;
annotationTask: string;
project: string;
}
interface MainRequirement {
requestID: string;
feishuLink: string;
name: string;
project: string;
priority: string;
businessGoal: string;
function: string;
model: string;
modelDescription: string;
status: string;
startDate: string;
endDate: string;
createdAt: string;
updatedAt: string;
cases: Case[];
selected?: boolean;
progress?: number;
}
interface Case {
caseID: string;
requestID: string;
feishuSubLink: string;
name: string;
priority: string;
modelDescription: string;
startDate: string;
endDate: string;
createdAt: string;
cloudMiningID?: string;
directionalCollectionID?: string;
vehicleMiningID?: string;
annotationTask?: string;
preAnnotationModel?: string;
trainingDataPercentage?: number;
}
const App: React.FC = () => {
const [requirements, setRequirements] = useState<MainRequirement[]>([]);
const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
const [searchTerms, setSearchTerms] = useState<SearchTerms>({
name: '',
modelDescription: '',
caseDescription: '',
caseName: '',
annotationTask: '',
project: ''
});
const [currentPage, setCurrentPage] = useState(1);
const [selectAll, setSelectAll] = useState(false);
const [showColumnSettings, setShowColumnSettings] = useState(false);
const [selectedRequirement, setSelectedRequirement] = useState<MainRequirement | null>(null);
const handleSearchChange = (field: keyof SearchTerms, value: string) => {
setSearchTerms(prev => ({
...prev,
[field]: value
}));
};
const [columns, setColumns] = useState<Column[]>([
{ key: 'requestID', title: 'RequestID', visible: true },
{ key: 'feishuLink', title: '飞书需求', visible: true },
{ key: 'name', title: '需求名称', visible: true },
{ key: 'project', title: '纳入项目', visible: true },
{ key: 'priority', title: '优先级', visible: true },
{ key: 'businessGoal', title: '关联业务目标', visible: true },
{ key: 'function', title: '功能', visible: true },
{ key: 'model', title: '模型', visible: true },
{ key: 'status', title: '需求状态', visible: true },
{ key: 'time', title: '时间范围', visible: true },
{ key: 'createdAt', title: '创建时间', visible: true },
{ key: 'updatedAt', title: '更新时间', visible: true },
]);
const [batchEdit, setBatchEdit] = useState({
annotationTask: '',
preAnnotationModel: '',
trainingDataPercentage: 80
});
const itemsPerPage = 10;
// Mock data initialization
useEffect(() => {
const mockData: MainRequirement[] = Array.from({ length: 15 }, (_, i) => ({
requestID: `REQ-${1000 + i}`,
feishuLink: `https://feishu.cn/req/${1000 + i}`,
name: `智能驾驶${i + 1}.0功能迭代`,
project: `项目${Math.floor(i / 3) + 1}`,
priority: ['P0', 'P1', 'P2'][i % 3],
businessGoal: ['提升安全性', '优化用户体验', '降低成本'][i % 3],
function: ['自动泊车', '车道保持', '自适应巡航'][i % 3],
model: ['感知模型', '决策模型', '控制模型'][i % 3],
modelDescription: `这是关于智能驾驶${i + 1}.0版本的详细模型需求描述`,
status: ['未开始', '进行中', '已完成'][i % 3],
startDate: `2023-0${(i % 9) + 1}-01`,
endDate: `2023-0${(i % 9) + 2}-30`,
createdAt: `2023-0${(i % 9) + 1}-01 10:00`,
updatedAt: `2023-0${(i % 9) + 1}-15 14:30`,
cases: Array.from({ length: (i % 3) + 1 }, (_, j) => ({
caseID: `CASE-${1000 + i}-${j + 1}`,
requestID: `REQ-${1000 + i}`,
feishuSubLink: `https://feishu.cn/req/${1000 + i}/sub/${j + 1}`,
name: `子需求${j + 1}: ${['数据采集', '模型训练', '系统集成'][j % 3]}`,
priority: ['P0', 'P1', 'P2'][j % 3],
modelDescription: `子需求${j + 1}的详细模型需求描述`,
startDate: `2023-0${(i % 9) + 1}-0${j + 1}`,
endDate: `2023-0${(i % 9) + 1}-${j + 15}`,
createdAt: `2023-0${(i % 9) + 1}-0${j + 1} 09:00`,
cloudMiningID: j === 0 ? `CLOUD-${1000 + i}-${j + 1}` : undefined,
directionalCollectionID: j === 1 ? `DIRECT-${1000 + i}-${j + 1}` : undefined,
vehicleMiningID: j === 2 ? `VEHICLE-${1000 + i}-${j + 1}` : undefined,
trainingDataPercentage: 80,
})),
}));
setRequirements(mockData);
}, []);
const toggleRow = (requestID: string) => {
setExpandedRows(prev => ({
...prev,
[requestID]: !prev[requestID],
}));
};
const handleSync = () => {
// Simulate sync from Feishu
alert('正在从飞书同步最新需求数据...');
};
const filteredRequirements = requirements.filter(req => {
return (
req.name.toLowerCase().includes(searchTerms.name.toLowerCase()) &&
req.modelDescription.toLowerCase().includes(searchTerms.modelDescription.toLowerCase()) &&
req.project.toLowerCase().includes(searchTerms.project.toLowerCase()) &&
(!searchTerms.caseName || req.cases.some(c => c.name.toLowerCase().includes(searchTerms.caseName.toLowerCase()))) &&
(!searchTerms.caseDescription || req.cases.some(c => c.modelDescription.toLowerCase().includes(searchTerms.caseDescription.toLowerCase()))) &&
(!searchTerms.annotationTask || req.cases.some(c => c.annotationTask?.toLowerCase().includes(searchTerms.annotationTask.toLowerCase())))
);
});
const paginatedRequirements = filteredRequirements.slice(
(currentPage - 1) * itemsPerPage,
currentPage * itemsPerPage
);
const totalPages = Math.ceil(filteredRequirements.length / itemsPerPage);
const updateCaseField = (
requestID: string,
caseID: string,
field: keyof Case,
value: any
) => {
setRequirements(prev =>
prev.map(req => {
if (req.requestID === requestID) {
return {
...req,
cases: req.cases.map(c => {
if (c.caseID === caseID) {
return { ...c, [field]: value };
}
return c;
}),
};
}
return req;
})
);
};
return (
<div className="min-h-screen bg-gray-50 p-6">
<div className="max-w-7xl mx-auto">
<div className="flex justify-between items-center mb-6">
<h1 className="text-2xl font-bold text-gray-800">task_management</h1>
<div className="flex space-x-4 items-center">
{/* Column Settings Modal */}
{showColumnSettings && (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
<div className="bg-white rounded-lg p-6 w-96">
<div className="flex justify-between items-center mb-4">
<h3 className="text-lg font-medium">列设置</h3>
<button
onClick={() => setShowColumnSettings(false)}
className="text-gray-500 hover:text-gray-700"
>
<i className="fas fa-times"></i>
</button>
</div>
<div className="space-y-3">
{columns.map((column) => (
<label key={column.key} className="flex items-center">
<input
type="checkbox"
checked={column.visible}
onChange={() => {
setColumns(
columns.map((c) =>
c.key === column.key ? { ...c, visible: !c.visible } : c
)
);
}}
className="form-checkbox h-4 w-4 text-blue-600"
/>
<span className="ml-2">{column.title}</span>
</label>
))}
</div>
<div className="mt-6 flex justify-end">
<button
onClick={() => setShowColumnSettings(false)}
className="!rounded-button whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
>
确定
</button>
</div>
</div>
</div>
)}
{/* Requirement Detail Modal */}
{selectedRequirement && (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
<div className="bg-white rounded-lg p-6 w-3/4 h-3/4 overflow-y-auto">
<div className="flex justify-between items-center mb-6">
<h3 className="text-xl font-medium">需求详情</h3>
<button
onClick={() => setSelectedRequirement(null)}
className="text-gray-500 hover:text-gray-700"
>
<i className="fas fa-times"></i>
</button>
</div>
<div className="grid grid-cols-2 gap-6 mb-6">
<div>
<h4 className="font-medium mb-4">基本信息</h4>
<div className="space-y-3">
<div className="flex">
<span className="w-32 text-gray-500">RequestID:</span>
<span>{selectedRequirement.requestID}</span>
</div>
<div className="flex">
<span className="w-32 text-gray-500">需求名称:</span>
<span>{selectedRequirement.name}</span>
</div>
<div className="flex">
<span className="w-32 text-gray-500">纳入项目:</span>
<span>{selectedRequirement.project}</span>
</div>
<div className="flex">
<span className="w-32 text-gray-500">优先级:</span>
<span>{selectedRequirement.priority}</span>
</div>
<div className="flex">
<span className="w-32 text-gray-500">关联业务目标:</span>
<span>{selectedRequirement.businessGoal}</span>
</div>
<div className="flex">
<span className="w-32 text-gray-500">时间范围:</span>
<span>{selectedRequirement.startDate} ~ {selectedRequirement.endDate}</span>
</div>
</div>
</div>
<div>
<h4 className="font-medium mb-4">进度信息</h4>
<div className="space-y-4">
<div>
<div className="flex justify-between mb-1">
<span>总体进度</span>
<span>{selectedRequirement.progress || 0}%</span>
</div>
<div className="w-full bg-gray-200 rounded-full h-2">
<div
className="bg-blue-600 rounded-full h-2"
style={{ width: `${selectedRequirement.progress || 0}%` }}
></div>
</div>
</div>
<div className="mt-4">
<h5 className="font-medium mb-2">子需求进度</h5>
{selectedRequirement.cases.map((c) => (
<div key={c.caseID} className="mb-3">
<div className="flex justify-between mb-1">
<span className="text-sm">{c.name}</span>
<span className="text-sm">{Math.floor(Math.random() * 100)}%</span>
</div>
<div className="w-full bg-gray-200 rounded-full h-1.5">
<div
className="bg-green-500 rounded-full h-1.5"
style={{ width: `${Math.floor(Math.random() * 100)}%` }}
></div>
</div>
</div>
))}
</div>
</div>
</div>
</div>
<div className="mt-6">
<h4 className="font-medium mb-4">备注信息</h4>
<textarea
className="w-full border border-gray-300 rounded-lg p-3 h-32"
placeholder="添加备注..."
></textarea>
</div>
</div>
</div>
)}
<div className="grid grid-cols-3 gap-4 mb-4">
<div className="relative">
<label className="block text-sm font-medium text-gray-700 mb-1">需求名称</label>
<input
type="text"
placeholder="搜索需求名称..."
className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
value={searchTerms.name}
onChange={e => handleSearchChange('name', e.target.value)}
/>
<i className="fas fa-search absolute left-3 top-[34px] text-gray-400"></i>
</div>
<div className="relative">
<label className="block text-sm font-medium text-gray-700 mb-1">需求描述</label>
<input
type="text"
placeholder="搜索需求描述..."
className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
value={searchTerms.modelDescription}
onChange={e => handleSearchChange('modelDescription', e.target.value)}
/>
<i className="fas fa-search absolute left-3 top-[34px] text-gray-400"></i>
</div>
<div className="relative">
<label className="block text-sm font-medium text-gray-700 mb-1">Case需求描述</label>
<input
type="text"
placeholder="搜索Case需求描述..."
className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
value={searchTerms.caseDescription}
onChange={e => handleSearchChange('caseDescription', e.target.value)}
/>
<i className="fas fa-search absolute left-3 top-[34px] text-gray-400"></i>
</div>
<div className="relative">
<label className="block text-sm font-medium text-gray-700 mb-1">Case需求名称</label>
<input
type="text"
placeholder="搜索Case需求名称..."
className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
value={searchTerms.caseName}
onChange={e => handleSearchChange('caseName', e.target.value)}
/>
<i className="fas fa-search absolute left-3 top-[34px] text-gray-400"></i>
</div>
<div className="relative">
<label className="block text-sm font-medium text-gray-700 mb-1">标注任务</label>
<input
type="text"
placeholder="搜索标注任务..."
className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
value={searchTerms.annotationTask}
onChange={e => handleSearchChange('annotationTask', e.target.value)}
/>
<i className="fas fa-search absolute left-3 top-[34px] text-gray-400"></i>
</div>
<div className="relative">
<label className="block text-sm font-medium text-gray-700 mb-1">纳入项目</label>
<input
type="text"
placeholder="搜索纳入项目..."
className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
value={searchTerms.project}
onChange={e => handleSearchChange('project', e.target.value)}
/>
<i className="fas fa-search absolute left-3 top-[34px] text-gray-400"></i>
</div>
</div>
<button
onClick={handleSync}
className="!rounded-button whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 flex items-center"
>
<i className="fas fa-sync-alt mr-2"></i>
从飞书同步需求
</button>
</div>
{/* Batch Edit Panel */}
<div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
<div className="flex items-center gap-4">
<h3 className="text-sm font-medium text-gray-700">批量编辑：</h3>
<select
value={batchEdit.annotationTask}
onChange={e => setBatchEdit(prev => ({ ...prev, annotationTask: e.target.value }))}
className="border border-gray-300 rounded px-2 py-1 text-sm"
>
<option value="">标注任务</option>
<option value="目标检测">目标检测</option>
<option value="语义分割">语义分割</option>
<option value="实例分割">实例分割</option>
<option value="车道线检测">车道线检测</option>
</select>
<select
value={batchEdit.preAnnotationModel}
onChange={e => setBatchEdit(prev => ({ ...prev, preAnnotationModel: e.target.value }))}
className="border border-gray-300 rounded px-2 py-1 text-sm"
>
<option value="">预标注模型</option>
<option value="YOLOv5">YOLOv5</option>
<option value="Mask R-CNN">Mask R-CNN</option>
<option value="DeepLabV3">DeepLabV3</option>
<option value="PointRend">PointRend</option>
</select>
<div className="flex items-center gap-2">
<input
type="number"
min="0"
max="100"
value={batchEdit.trainingDataPercentage}
onChange={e => setBatchEdit(prev => ({ ...prev, trainingDataPercentage: parseInt(e.target.value) }))}
className="border border-gray-300 rounded px-2 py-1 w-16 text-sm"
/>
<span className="text-sm text-gray-600">训练数据%</span>
</div>
<button
onClick={() => {
setRequirements(prevReqs =>
prevReqs.map(req => ({
...req,
cases: req.selected
? req.cases.map(c => ({
...c,
annotationTask: batchEdit.annotationTask || c.annotationTask,
preAnnotationModel: batchEdit.preAnnotationModel || c.preAnnotationModel,
trainingDataPercentage: batchEdit.trainingDataPercentage
}))
: req.cases
}))
);
}}
className="!rounded-button whitespace-nowrap bg-green-600 hover:bg-green-700 text-white px-4 py-1 text-sm"
>
应用到选中项
</button>
</div>
</div>
</div>
<div className="bg-white rounded-xl shadow overflow-hidden">
<div className="flex justify-between items-center p-4 border-b">
<button
onClick={() => {
const mockData = {
xminer: {
planned: 1000,
current: 800,
delivered: 750,
progress: 75
},
directional: {
planned: 1500,
current: 1200,
delivered: 1100,
progress: 73.3
},
cloud: {
planned: 2000,
current: 1600,
delivered: 1500,
progress: 75
},
annotation: {
planned: 4500,
current: 3600,
delivered: 3200,
manual: 2000,
auto: 1200,
progress: 71.1
}
};
const getProgressColor = (current: number, delivered: number, planned: number) => {
if (current <= delivered) return 'bg-green-600';
const deficit = current - delivered;
if (deficit > planned * 0.1) return 'bg-red-600';
return 'bg-yellow-600';
};
const statsModal = document.createElement('div');
statsModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
statsModal.innerHTML = `
<div class="bg-white rounded-lg p-6 w-3/4 max-h-[80vh] overflow-y-auto">
<div class="flex justify-between items-center mb-6">
<h3 class="text-xl font-medium">需求进度</h3>
<button class="!rounded-button whitespace-nowrap text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200" onclick="this.closest('.fixed').remove()">
<i class="fas fa-times text-lg"></i>
</button>
</div>
<div class="grid grid-cols-1 gap-6">
<div class="bg-blue-50 rounded-lg p-6">
<div class="flex justify-between items-center mb-4">
<div class="text-lg font-medium">Xminer采集进度</div>
<div class="text-lg font-semibold text-blue-700">需求量 vs 计划量：${mockData.xminer.current}/${mockData.xminer.planned}</div>
</div>
<div class="flex items-center justify-between mb-2">
<div class="flex items-center space-x-2">
<div class="text-sm font-medium">应交/实交：${mockData.xminer.current}/${mockData.xminer.delivered}</div>
<div class="text-sm font-medium">${mockData.xminer.progress}%</div>
</div>
</div>
<div class="w-full bg-gray-200 rounded-full h-3">
<div class="${getProgressColor(mockData.xminer.current, mockData.xminer.delivered, mockData.xminer.planned)} rounded-full h-3 transition-all duration-300" style="width: ${mockData.xminer.progress}%"></div>
</div>
</div>
<div class="bg-purple-50 rounded-lg p-6">
<div class="flex justify-between items-center mb-4">
<div class="text-lg font-medium">定向采集进度</div>
<div class="text-lg font-semibold text-purple-700">需求量 vs 计划量：${mockData.directional.current}/${mockData.directional.planned}</div>
</div>
<div class="flex items-center justify-between mb-2">
<div class="flex items-center space-x-2">
<div class="text-sm font-medium">应交/实交：${mockData.directional.current}/${mockData.directional.delivered}</div>
<div class="text-sm font-medium">${mockData.directional.progress}%</div>
</div>
</div>
<div class="w-full bg-gray-200 rounded-full h-3">
<div class="${getProgressColor(mockData.directional.current, mockData.directional.delivered, mockData.directional.planned)} rounded-full h-3 transition-all duration-300" style="width: ${mockData.directional.progress}%"></div>
</div>
</div>
<div class="bg-green-50 rounded-lg p-6">
<div class="flex justify-between items-center mb-4">
<div class="text-lg font-medium">云端挖掘进度</div>
<div class="text-lg font-semibold text-green-700">需求量 vs 计划量：${mockData.cloud.current}/${mockData.cloud.planned}</div>
</div>
<div class="flex items-center justify-between mb-2">
<div class="flex items-center space-x-2">
<div class="text-sm font-medium">应交/实交：${mockData.cloud.current}/${mockData.cloud.delivered}</div>
<div class="text-sm font-medium">${mockData.cloud.progress}%</div>
</div>
</div>
<div class="w-full bg-gray-200 rounded-full h-3">
<div class="bg-green-600 rounded-full h-3 transition-all duration-300" style="width: ${mockData.cloud.progress}%"></div>
</div>
</div>
<div class="bg-yellow-50 rounded-lg p-6">
<div class="flex justify-between items-center mb-4">
<div class="text-lg font-medium">总标注进度</div>
<div class="text-lg font-semibold text-yellow-700">需求量 vs 计划量：${mockData.annotation.current}/${mockData.annotation.planned}</div>
</div>
<div class="space-y-4">
<div class="flex items-center justify-between mb-2">
<div class="flex items-center space-x-2">
<div class="text-sm font-medium">应交/实交：${mockData.annotation.current}/${mockData.annotation.delivered}</div>
<div class="text-sm font-medium">${mockData.annotation.progress}%</div>
</div>
</div>
<div class="w-full bg-gray-200 rounded-full h-3 mb-4">
<div class="${getProgressColor(mockData.annotation.current, mockData.annotation.delivered, mockData.annotation.planned)} rounded-full h-3 transition-all duration-300" style="width: ${mockData.annotation.progress}%"></div>
</div>
<div class="space-y-2">
<div class="flex justify-between items-center">
<div class="text-sm text-gray-500">标注完成度</div>
<div class="flex items-center space-x-4">
<div class="flex items-center">
<div class="w-3 h-3 rounded-full bg-blue-600 mr-1"></div>
<span class="text-sm text-gray-600">人工标注: ${mockData.annotation.manual}</span>
</div>
<div class="flex items-center">
<div class="w-3 h-3 rounded-full bg-green-600 mr-1"></div>
<span class="text-sm text-gray-600">自动标注: ${mockData.annotation.auto}</span>
</div>
</div>
</div>
<div class="relative w-full bg-gray-200 rounded-full h-3">
<div class="absolute left-0 top-0 h-3 bg-blue-600 rounded-l-full" style="width: ${(mockData.annotation.manual / mockData.annotation.planned) * 100}%"></div>
<div class="absolute h-3 bg-green-600" style="left: ${(mockData.annotation.manual / mockData.annotation.planned) * 100}%; width: ${(mockData.annotation.auto / mockData.annotation.planned) * 100}%"></div>
</div>
</div>
</div>
</div>
</div>
</div>
`;
document.body.appendChild(statsModal);
}}
className="!rounded-button whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 flex items-center"
>
<i className="fas fa-chart-line mr-2"></i>
需求进度
</button>
<button
onClick={() => setShowColumnSettings(!showColumnSettings)}
className="!rounded-button whitespace-nowrap bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 flex items-center"
>
<i className="fas fa-columns mr-2"></i>
列设置
</button>
</div>
<div className="overflow-x-auto">
<table className="min-w-full divide-y divide-gray-200">
<thead className="bg-gray-50">
<tr>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
<input
type="checkbox"
checked={selectAll}
onChange={e => {
setSelectAll(e.target.checked);
setRequirements(prevReqs =>
prevReqs.map(req => ({ ...req, selected: e.target.checked }))
);
}}
className="h-4 w-4 text-blue-600 border-gray-300 rounded"
/>
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
操作
</th>
{columns.map(column =>
column.visible && (
<th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
{column.title}
</th>
)
)}
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
RequestID
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
飞书需求
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
需求名称
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
纳入项目
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
优先级
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
关联业务目标
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
功能
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
模型
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
需求状态
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
时间范围
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
创建时间
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
更新时间
</th>
</tr>
</thead>
<tbody className="bg-white divide-y divide-gray-200">
{paginatedRequirements.map(requirement => (
<React.Fragment key={requirement.requestID}>
<tr className="hover:bg-gray-50">
<td className="px-6 py-4 whitespace-nowrap">
<input
type="checkbox"
checked={requirement.selected || false}
onChange={e => {
setRequirements(prevReqs =>
prevReqs.map(req =>
req.requestID === requirement.requestID
? { ...req, selected: e.target.checked }
: req
)
);
}}
className="h-4 w-4 text-blue-600 border-gray-300 rounded"
/>
</td>
<td className="px-6 py-4 whitespace-nowrap">
<div className="flex space-x-2">
<button
onClick={() => toggleRow(requirement.requestID)}
className="text-blue-600 hover:text-blue-800"
>
<i
className={`fas ${
expandedRows[requirement.requestID] ? 'fa-minus' : 'fa-plus'
}`}
></i>
</button>
<button
onClick={() => setSelectedRequirement(requirement)}
className="text-gray-600 hover:text-gray-800"
>
<i className="fas fa-external-link-alt"></i>
</button>
</div>
</td>
<td className="px-6 py-4 whitespace-nowrap">
<a
href={`#${requirement.requestID}`}
className="text-blue-600 hover:underline"
>
{requirement.requestID}
</a>
</td>
<td className="px-6 py-4 whitespace-nowrap">
<a
href={requirement.feishuLink}
target="_blank"
rel="noopener noreferrer"
className="text-blue-600 hover:underline"
>
查看
</a>
</td>
<td className="px-6 py-4 whitespace-nowrap">
{requirement.name}
</td>
<td className="px-6 py-4 whitespace-nowrap">
{requirement.project}
</td>
<td className="px-6 py-4 whitespace-nowrap">
<span
className={`px-2 py-1 rounded-full text-xs ${
requirement.priority === 'P0'
? 'bg-red-100 text-red-800'
: requirement.priority === 'P1'
? 'bg-yellow-100 text-yellow-800'
: 'bg-green-100 text-green-800'
}`}
>
{requirement.priority}
</span>
</td>
<td className="px-6 py-4 whitespace-nowrap">
{requirement.businessGoal}
</td>
<td className="px-6 py-4 whitespace-nowrap">
{requirement.function}
</td>
<td className="px-6 py-4 whitespace-nowrap">
{requirement.model}
</td>
<td className="px-6 py-4 whitespace-nowrap">
<span
className={`px-2 py-1 rounded-full text-xs ${
requirement.status === '已完成'
? 'bg-green-100 text-green-800'
: requirement.status === '进行中'
? 'bg-blue-100 text-blue-800'
: 'bg-gray-100 text-gray-800'
}`}
>
{requirement.status}
</span>
</td>
<td className="px-6 py-4 whitespace-nowrap">
{requirement.startDate} ~ {requirement.endDate}
</td>
<td className="px-6 py-4 whitespace-nowrap">
{requirement.createdAt}
</td>
<td className="px-6 py-4 whitespace-nowrap">
{requirement.updatedAt}
</td>
</tr>
{expandedRows[requirement.requestID] && (
<tr className="bg-gray-50">
<td colSpan={13} className="px-6 py-4">
<div className="ml-8">
<table className="min-w-full divide-y divide-gray-200">
<thead>
<tr>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
CaseID
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
飞书子需求
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
需求名称
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
优先级
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
时间范围
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
标注任务
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
预标注模型
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
训练数据%
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
操作
</th>
</tr>
</thead>
<tbody className="bg-white divide-y divide-gray-200">
{requirement.cases.map(c => (
<tr key={c.caseID} className="hover:bg-gray-100">
<td className="px-6 py-4 whitespace-nowrap">
{c.caseID}
</td>
<td className="px-6 py-4 whitespace-nowrap">
<a
href={c.feishuSubLink}
target="_blank"
rel="noopener noreferrer"
className="text-blue-600 hover:underline"
>
查看
</a>
</td>
<td className="px-6 py-4 whitespace-nowrap">
{c.name}
</td>
<td className="px-6 py-4 whitespace-nowrap">
<span
className={`px-2 py-1 rounded-full text-xs ${
c.priority === 'P0'
? 'bg-red-100 text-red-800'
: c.priority === 'P1'
? 'bg-yellow-100 text-yellow-800'
: 'bg-green-100 text-green-800'
}`}
>
{c.priority}
</span>
</td>
<td className="px-6 py-4 whitespace-nowrap">
{c.startDate} ~ {c.endDate}
</td>
<td className="px-6 py-4 whitespace-nowrap">
<select
value={c.annotationTask || ''}
onChange={e =>
updateCaseField(
requirement.requestID,
c.caseID,
'annotationTask',
e.target.value
)
}
className="border border-gray-300 rounded px-2 py-1 text-sm"
>
<option value="">请选择</option>
<option value="目标检测">目标检测</option>
<option value="语义分割">语义分割</option>
<option value="实例分割">实例分割</option>
<option value="车道线检测">车道线检测</option>
</select>
</td>
<td className="px-6 py-4 whitespace-nowrap">
<select
value={c.preAnnotationModel || ''}
onChange={e =>
updateCaseField(
requirement.requestID,
c.caseID,
'preAnnotationModel',
e.target.value
)
}
className="border border-gray-300 rounded px-2 py-1 text-sm"
>
<option value="">请选择</option>
<option value="YOLOv5">YOLOv5</option>
<option value="Mask R-CNN">Mask R-CNN</option>
<option value="DeepLabV3">DeepLabV3</option>
<option value="PointRend">PointRend</option>
</select>
</td>
<td className="px-6 py-4 whitespace-nowrap">
<input
type="number"
min="0"
max="100"
value={c.trainingDataPercentage || 80}
onChange={e =>
updateCaseField(
requirement.requestID,
c.caseID,
'trainingDataPercentage',
parseInt(e.target.value)
)
}
className="border border-gray-300 rounded px-2 py-1 w-16 text-sm"
/>
%
</td>
<td className="px-6 py-4 whitespace-nowrap space-x-2">
<button
onClick={() =>
window.open(
`https://screening.example.com?id=${c.cloudMiningID}`,
'_blank'
)
}
disabled={!c.cloudMiningID}
className={`!rounded-button whitespace-nowrap px-3 py-1 text-sm ${
c.cloudMiningID
? 'bg-purple-600 hover:bg-purple-700 text-white'
: 'bg-gray-300 text-gray-500 cursor-not-allowed'
}`}
>
云端挖掘
</button>
<button
onClick={() =>
window.open(
`https://collection.example.com?id=${c.directionalCollectionID}`,
'_blank'
)
}
disabled={
!c.directionalCollectionID ||
!c.annotationTask ||
!c.preAnnotationModel
}
className={`!rounded-button whitespace-nowrap px-3 py-1 text-sm ${
c.directionalCollectionID &&
c.annotationTask &&
c.preAnnotationModel
? 'bg-green-600 hover:bg-green-700 text-white'
: 'bg-gray-300 text-gray-500 cursor-not-allowed'
}`}
>
定向采集
</button>
<button
onClick={() =>
window.open(
`https://xminer.example.com?id=${c.vehicleMiningID}`,
'_blank'
)
}
disabled={
!c.vehicleMiningID ||
!c.annotationTask ||
!c.preAnnotationModel
}
className={`!rounded-button whitespace-nowrap px-3 py-1 text-sm ${
c.vehicleMiningID &&
c.annotationTask &&
c.preAnnotationModel
? 'bg-blue-600 hover:bg-blue-700 text-white'
: 'bg-gray-300 text-gray-500 cursor-not-allowed'
}`}
>
车端挖掘
</button>
</td>
</tr>
))}
</tbody>
</table>
</div>
</td>
</tr>
)}
</React.Fragment>
))}
</tbody>
</table>
</div>
<div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-200">
<div className="flex-1 flex justify-between sm:hidden">
<button
onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
disabled={currentPage === 1}
className="!rounded-button whitespace-nowrap relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
>
上一页
</button>
<button
onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
disabled={currentPage === totalPages}
className="!rounded-button whitespace-nowrap ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
>
下一页
</button>
</div>
<div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
<div>
<p className="text-sm text-gray-700">
显示{' '}
<span className="font-medium">
{(currentPage - 1) * itemsPerPage + 1}
</span>{' '}
到{' '}
<span className="font-medium">
{Math.min(currentPage * itemsPerPage, filteredRequirements.length)}
</span>{' '}
条，共 <span className="font-medium">{filteredRequirements.length}</span>{' '}
条
</p>
</div>
<div>
<nav
className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
aria-label="Pagination"
>
<button
onClick={() => setCurrentPage(1)}
disabled={currentPage === 1}
className="!rounded-button whitespace-nowrap relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
>
<span className="sr-only">第一页</span>
<i className="fas fa-angle-double-left"></i>
</button>
<button
onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
disabled={currentPage === 1}
className="!rounded-button whitespace-nowrap relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
>
<span className="sr-only">上一页</span>
<i className="fas fa-angle-left"></i>
</button>
{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
let pageNum;
if (totalPages <= 5) {
pageNum = i + 1;
} else if (currentPage <= 3) {
pageNum = i + 1;
} else if (currentPage >= totalPages - 2) {
pageNum = totalPages - 4 + i;
} else {
pageNum = currentPage - 2 + i;
}
return (
<button
key={pageNum}
onClick={() => setCurrentPage(pageNum)}
className={`!rounded-button whitespace-nowrap relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
currentPage === pageNum
? 'bg-blue-600 border-blue-600 text-white'
: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
}`}
>
{pageNum}
</button>
);
})}
<button
onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
disabled={currentPage === totalPages}
className="!rounded-button whitespace-nowrap relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
>
<span className="sr-only">下一页</span>
<i className="fas fa-angle-right"></i>
</button>
<button
onClick={() => setCurrentPage(totalPages)}
disabled={currentPage === totalPages}
className="!rounded-button whitespace-nowrap relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
>
<span className="sr-only">最后一页</span>
<i className="fas fa-angle-double-right"></i>
</button>
</nav>
</div>
</div>
</div>
</div>
</div>
</div>
);
};
export default App