// 代码已包含 CSS：使用 TailwindCSS , 安装 TailwindCSS 后方可看到布局样式效果
import React, { useState, useRef, useEffect } from 'react';
import * as echarts from 'echarts';
const App: React.FC = () => {
const [currentFile, setCurrentFile] = useState({
name: 'task_001_walk.bvh',
duration: '04:12',
type: 'B',
totalFrames: 1200
});
const [progress, setProgress] = useState({ current: 12, total: 50 });
const [isPlaying, setIsPlaying] = useState(false);
const [playbackSpeed, setPlaybackSpeed] = useState(1);
const [currentFrame, setCurrentFrame] = useState(360);
const [segments, setSegments] = useState([
{ id: 1, start: 120, end: 240, label1: '行走', label2: '正常行走', color: '#3b82f6' },
{ id: 2, start: 360, end: 540, label1: '跳跃', label2: '单脚跳跃', color: '#10b981' }
]);
const [activeSegment, setActiveSegment] = useState<number | null>(null);
const [showAnnotationPanel, setShowAnnotationPanel] = useState(false);
const [newSegment, setNewSegment] = useState({ start: 0, end: 0 });
const [label1, setLabel1] = useState('');
const [label2, setLabel2] = useState('');
const [videoOpacity, setVideoOpacity] = useState(0.5);
const [viewMode, setViewMode] = useState<'video' | 'motion'>('video');
const chartRef = useRef<HTMLDivElement>(null);
const bvhContainerRef = useRef<HTMLDivElement>(null);
useEffect(() => {
if (chartRef.current) {
const chart = echarts.init(chartRef.current);
const option = {
animation: false,
grid: { top: 20, right: 20, bottom: 30, left: 50 },
xAxis: { type: 'category', data: Array.from({ length: currentFile.totalFrames }, (_, i) => i) },
yAxis: { type: 'value' },
series: [{
data: Array.from({ length: currentFile.totalFrames }, (_, i) => Math.sin(i / 20) * 2 + 1),
type: 'line',
smooth: true,
lineStyle: { color: '#3b82f6' }
}]
};
chart.setOption(option);
return () => chart.dispose();
}
}, [currentFile.totalFrames]);
const handlePlayPause = () => setIsPlaying(!isPlaying);
const handleSpeedChange = (speed: number) => setPlaybackSpeed(speed);
const handleFrameChange = (frame: number) => setCurrentFrame(Math.min(Math.max(frame, 0), currentFile.totalFrames));
const handleSegmentClick = (segmentId: number) => {
const segment = segments.find(s => s.id === segmentId);
if (segment) {
setCurrentFrame(segment.start);
setActiveSegment(segmentId);
setShowAnnotationPanel(true);
}
};
const handleCreateSegment = (start: number, end: number) => {
setNewSegment({ start, end });
setShowAnnotationPanel(true);
setActiveSegment(null);
};
const handleSaveSegment = () => {
if (newSegment.end > newSegment.start) {
const newId = segments.length > 0 ? Math.max(...segments.map(s => s.id)) + 1 : 1;
setSegments([...segments, {
id: newId,
start: newSegment.start,
end: newSegment.end,
label1,
label2,
color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
}]);
}
setShowAnnotationPanel(false);
};
const handleDeleteSegment = (id: number) => {
setSegments(segments.filter(s => s.id !== id));
if (activeSegment === id) {
setActiveSegment(null);
setShowAnnotationPanel(false);
}
};
return (
<div className="flex flex-col h-screen bg-gray-50">
{/* 顶部全局信息栏 */}
<div className="flex items-center justify-between px-6 py-2 bg-white border-b border-gray-200 h-[5%]">
<div className="flex items-center space-x-4">
<span className="font-medium">文件: {currentFile.name}</span>
<span>时长: {currentFile.duration}</span>
<span className={`px-2 py-1 rounded text-xs ${
currentFile.type === 'A' ? 'bg-blue-100 text-blue-800' :
currentFile.type === 'B' ? 'bg-green-100 text-green-800' :
'bg-purple-100 text-purple-800'
}`}>
Type: {currentFile.type} {currentFile.type === 'A' ? '(BVH)' : currentFile.type === 'B' ? '(BVH+视频)' : '(完整)'}
</span>
</div>
<div className="flex-1 flex justify-center">
<div className="w-1/2 bg-gray-200 rounded-full h-2.5">
<div
className="bg-blue-600 h-2.5 rounded-full"
style={{ width: `${(progress.current / progress.total) * 100}%` }}
></div>
</div>
<span className="ml-2 text-sm text-gray-600">
进度: {progress.current}/{progress.total} ({(progress.current / progress.total * 100).toFixed(0)}%)
</span>
</div>
<div className="flex items-center space-x-2">
<button className="!rounded-button whitespace-nowrap px-3 py-1 bg-gray-100 hover:bg-gray-200 text-sm">
<i className="fas fa-forward mr-1"></i> 跳过此文件
</button>
<button className="!rounded-button whitespace-nowrap px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm">
<i className="fas fa-exclamation-triangle mr-1"></i> 标记异常
</button>
<button className="!rounded-button whitespace-nowrap px-3 py-1 bg-gray-100 hover:bg-gray-200 text-sm">
<i className="fas fa-cog"></i>
</button>
</div>
</div>
{/* 中部核心工作区 */}
<div className="flex flex-1 overflow-hidden" style={{ height: '65%' }}>
{/* 左侧 3D BVH 播放器 */}
<div className="w-[70%] bg-gray-900 relative overflow-hidden" ref={bvhContainerRef}>
<div className="absolute inset-0 flex items-center justify-center">
<div className="text-white text-lg">3D BVH 播放器 (模拟)</div>
</div>
{/* 视频叠加控制 */}
{currentFile.type !== 'A' && (
<div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white p-2 rounded">
<div className="flex items-center space-x-2">
<span>视频模式:</span>
<select
className="bg-gray-800 text-white text-sm px-2 py-1 rounded"
value={viewMode}
onChange={(e) => setViewMode(e.target.value as any)}
>
<option value="video">视频背景</option>
<option value="motion">运动曲线</option>
</select>
{viewMode === 'video' && (
<div className="flex items-center space-x-2">
<span>透明度:</span>
<input
type="range"
min="0"
max="1"
step="0.1"
value={videoOpacity}
onChange={(e) => setVideoOpacity(parseFloat(e.target.value))}
className="w-20"
/>
<span>{(videoOpacity * 100).toFixed(0)}%</span>
</div>
)}
</div>
</div>
)}
{/* 脚本摘要 (仅Type C) */}
{currentFile.type === 'C' && (
<div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded max-w-xs">
<div className="text-sm font-semibold mb-1">当前脚本步骤:</div>
<div className="text-xs">拿起桌上的杯子并移动到右侧区域</div>
</div>
)}
</div>
{/* 右侧辅助视图 */}
<div className="w-[30%] bg-white border-l border-gray-200 p-4">
{viewMode === 'video' && currentFile.type !== 'A' ? (
<div className="h-full flex items-center justify-center bg-black">
<div className="text-white">同步视频画面 (模拟)</div>
</div>
) : (
<div ref={chartRef} className="w-full h-full"></div>
)}
</div>
</div>
{/* 底部时间轴与切片管理区 */}
<div className="bg-white border-t border-gray-200 p-4" style={{ height: '20%' }}>
<div className="h-1/2 mb-2 bg-gray-100 rounded overflow-hidden">
{/* 缩略图轨道 */}
<div className="flex h-full items-center px-2 overflow-x-auto">
{Array.from({ length: 20 }).map((_, i) => (
<div key={i} className="flex-shrink-0 w-16 h-full bg-gray-300 mx-1 rounded-sm"></div>
))}
</div>
</div>
<div className="h-1/2 relative">
{/* 切片轨道 */}
<div className="h-full relative">
<div className="absolute top-0 left-0 right-0 h-1 bg-gray-200"></div>
{segments.map(segment => (
<div
key={segment.id}
className="absolute h-4 top-0 rounded-sm cursor-pointer"
style={{
left: `${(segment.start / currentFile.totalFrames) * 100}%`,
width: `${((segment.end - segment.start) / currentFile.totalFrames) * 100}%`,
backgroundColor: segment.color,
opacity: 0.7
}}
onClick={() => handleSegmentClick(segment.id)}
>
<div className="absolute -top-1 left-0 w-2 h-2 rounded-full bg-green-500"></div>
<div className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-red-500"></div>
</div>
))}
{/* 当前播放头 */}
<div
className="absolute top-0 w-0.5 h-4 bg-red-500"
style={{ left: `${(currentFrame / currentFile.totalFrames) * 100}%` }}
></div>
{/* 新建切片选区 */}
{showAnnotationPanel && activeSegment === null && (
<div
className="absolute h-4 top-0 bg-blue-200 rounded-sm opacity-50"
style={{
left: `${(newSegment.start / currentFile.totalFrames) * 100}%`,
width: `${((newSegment.end - newSegment.start) / currentFile.totalFrames) * 100}%`
}}
></div>
)}
</div>
{/* 播放控制条 */}
<div className="absolute bottom-0 left-0 right-0 flex items-center justify-between">
<div className="flex items-center space-x-2">
<button className="!rounded-button whitespace-nowrap px-3 py-1 bg-gray-100 hover:bg-gray-200 text-sm">
<i className="fas fa-step-backward mr-1"></i> 上一切片
</button>
<button
className="!rounded-button whitespace-nowrap px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm"
onClick={handlePlayPause}
>
<i className={`fas fa-${isPlaying ? 'pause' : 'play'} mr-1`}></i> {isPlaying ? '暂停' : '播放'}
</button>
<button className="!rounded-button whitespace-nowrap px-3 py-1 bg-gray-100 hover:bg-gray-200 text-sm">
<i className="fas fa-step-forward mr-1"></i> 下一切片
</button>
</div>
<div className="flex items-center space-x-2">
{[1, 2, 4].map(speed => (
<button
key={speed}
className={`!rounded-button whitespace-nowrap px-3 py-1 text-sm ${
playbackSpeed === speed ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'
}`}
onClick={() => handleSpeedChange(speed)}
>
{speed}x
</button>
))}
</div>
<div className="text-sm text-gray-600">
当前帧: {currentFrame} / 总帧数: {currentFile.totalFrames}
</div>
</div>
</div>
</div>
{/* 右侧结构化标注面板 */}
{showAnnotationPanel && (
<div className="absolute top-[5%] right-0 w-80 h-[95%] bg-white border-l border-gray-200 shadow-lg p-4 overflow-y-auto">
{activeSegment ? (
<>
<div className="mb-4">
<h3 className="font-medium mb-2">时间范围</h3>
<div className="flex items-center space-x-2">
<div className="flex-1">
<label className="block text-sm text-gray-600 mb-1">开始</label>
<div className="flex items-center">
<input
type="text"
className="border border-gray-300 rounded px-2 py-1 w-full"
value={segments.find(s => s.id === activeSegment)?.start}
onChange={(e) => {
const val = parseInt(e.target.value);
setSegments(segments.map(s =>
s.id === activeSegment ? {...s, start: val} : s
));
}}
/>
<span className="ml-2 text-sm text-gray-500">帧</span>
</div>
</div>
<div className="flex-1">
<label className="block text-sm text-gray-600 mb-1">结束</label>
<div className="flex items-center">
<input
type="text"
className="border border-gray-300 rounded px-2 py-1 w-full"
value={segments.find(s => s.id === activeSegment)?.end}
onChange={(e) => {
const val = parseInt(e.target.value);
setSegments(segments.map(s =>
s.id === activeSegment ? {...s, end: val} : s
));
}}
/>
<span className="ml-2 text-sm text-gray-500">帧</span>
</div>
</div>
</div>
</div>
<div className="mb-4">
<h3 className="font-medium mb-2">动作分类</h3>
<div className="space-y-3">
<div>
<label className="block text-sm text-gray-600 mb-1">一级分类</label>
<select
className="border border-gray-300 rounded px-2 py-1 w-full"
value={segments.find(s => s.id === activeSegment)?.label1}
onChange={(e) => {
setSegments(segments.map(s =>
s.id === activeSegment ? {...s, label1: e.target.value} : s
));
}}
>
<option value="">请选择</option>
<option value="行走">行走</option>
<option value="奔跑">奔跑</option>
<option value="跳跃">跳跃</option>
<option value="操作物体">操作物体</option>
</select>
</div>
<div>
<label className="block text-sm text-gray-600 mb-1">二级分类</label>
<select
className="border border-gray-300 rounded px-2 py-1 w-full"
value={segments.find(s => s.id === activeSegment)?.label2}
onChange={(e) => {
setSegments(segments.map(s =>
s.id === activeSegment ? {...s, label2: e.target.value} : s
));
}}
>
<option value="">请选择</option>
{segments.find(s => s.id === activeSegment)?.label1 === '行走' && (
<>
<option value="正常行走">正常行走</option>
<option value="负重行走">负重行走</option>
<option value="跛行">跛行</option>
</>
)}
{segments.find(s => s.id === activeSegment)?.label1 === '跳跃' && (
<>
<option value="单脚跳跃">单脚跳跃</option>
<option value="双脚跳跃">双脚跳跃</option>
</>
)}
{segments.find(s => s.id === activeSegment)?.label1 === '操作物体' && (
<>
<option value="抓取">抓取</option>
<option value="放置">放置</option>
<option value="传递">传递</option>
</>
)}
</select>
</div>
</div>
</div>
{/* 脚本对照区 (仅Type C) */}
{currentFile.type === 'C' && (
<div className="mb-4">
<h3 className="font-medium mb-2">脚本对照</h3>
<div className="bg-gray-50 p-3 rounded text-sm">
<p>拿起桌上的杯子并移动到右侧区域</p>
</div>
</div>
)}
<div className="flex justify-between mt-6">
<button
className="!rounded-button whitespace-nowrap px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700"
onClick={() => handleDeleteSegment(activeSegment)}
>
<i className="fas fa-trash mr-1"></i> 删除切片
</button>
<div className="flex space-x-2 ml-auto">
<button
className="!rounded-button whitespace-nowrap px-4 py-2 bg-gray-100 hover:bg-gray-200"
onClick={() => setShowAnnotationPanel(false)}
>
取消
</button>
<button
className="!rounded-button whitespace-nowrap px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
onClick={handleSaveSegment}
>
保存修改
</button>
</div>
</div>
</>
) : (
<>
{/* 折叠面板区域 */}
<div className="space-y-2 mb-4">
{/* 添加数据折叠栏 */}
<div className="border border-gray-200 rounded">
<button
className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100"
onClick={() => setNewSegment({ start: currentFrame - 30, end: currentFrame + 30 })}
>
<span className="font-medium">添加新切片</span>
<i className="fas fa-plus"></i>
</button>
</div>
{/* 数据信息折叠栏 */}
<div className="border border-gray-200 rounded">
<div className="p-3 bg-gray-50">
<h4 className="font-medium mb-2">当前文件信息</h4>
<div className="text-sm space-y-1">
<p>文件名: {currentFile.name}</p>
<p>时长: {currentFile.duration}</p>
<p>类型: {currentFile.type === 'A' ? 'BVH' : currentFile.type === 'B' ? 'BVH+视频' : '完整'}</p>
<p>总帧数: {currentFile.totalFrames}</p>
</div>
</div>
</div>
{/* 原始脚本折叠栏 (仅Type C) */}
{currentFile.type === 'C' && (
<div className="border border-gray-200 rounded">
<div className="p-3 bg-gray-50">
<h4 className="font-medium mb-2">原始脚本</h4>
<div className="text-sm">
<p>拿起桌上的杯子并移动到右侧区域</p>
</div>
</div>
</div>
)}
</div>
{/* 切片列表 */}
<div className="border-t pt-4">
<h3 className="font-medium mb-2">所有切片</h3>
{segments.length === 0 ? (
<p className="text-sm text-gray-500">暂无切片</p>
) : (
<div className="space-y-2">
{segments.map(segment => (
<div
key={segment.id}
className="flex items-center p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
onClick={() => handleSegmentClick(segment.id)}
>
<div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: segment.color }}></div>
<div className="flex-1">
<div className="text-sm font-medium">{segment.label1} - {segment.label2}</div>
<div className="text-xs text-gray-500">帧: {segment.start} - {segment.end}</div>
</div>
<i className="fas fa-chevron-right text-gray-400"></i>
</div>
))}
</div>
)}
</div>
</>
)}
</div>
)}
</div>
);
};
export default App