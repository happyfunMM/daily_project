// 代码已包含 CSS：使用 TailwindCSS , 安装 TailwindCSS 后方可看到布局样式效果

import React, { useState, useEffect, useRef } from 'react';
import { Button, Select, Input, Divider, Modal, Slider } from 'antd';
import { 
  FileOutlined, 
  ClockCircleOutlined, 
  VideoCameraOutlined, 
  ProjectOutlined,
  ForwardOutlined,
  KeyboardOutlined,
  RobotOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  ScissorOutlined,
  GroupOutlined,
  ExclamationCircleOutlined,
  CommentOutlined,
  RulerOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  BackwardOutlined,
  ForwardFilled,
  PlayCircleOutlined,
  CloseOutlined,
  DownOutlined,
  LeftOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';

const App: React.FC = () => {
  const [currentFrame, setCurrentFrame] = useState(124);
  const [totalFrames, setTotalFrames] = useState(3600);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [splitState, setSplitState] = useState<'inactive' | 'start-set' | 'end-set'>('inactive');
  const [splitStartFrame, setSplitStartFrame] = useState<number | null>(null);
  const [splitEndFrame, setSplitEndFrame] = useState<number | null>(null);
  const [showAnnotationPanel, setShowAnnotationPanel] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [activeTool, setActiveTool] = useState('select');
  const [segments, setSegments] = useState([
    { id: 1, name: '行走循环', start: 0, end: 12, level1: '移动', level2: '行走' },
    { id: 2, name: '转身动作', start: 12, end: 18, level1: '移动', level2: '转身' },
    { id: 3, name: '拾取物品', start: 18, end: 25, level1: '操作', level2: '拾取' },
    { id: 4, name: '站立等待', start: 25, end: 32, level1: '静止', level2: '站立' },
    { id: 5, name: '行走循环', start: 32, end: 44, level1: '移动', level2: '行走' },
    { id: 6, name: '挥手动作', start: 44, end: 48, level1: '交互', level2: '挥手' }
  ]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const annotationPanelRef = useRef<HTMLDivElement>(null);

  const handleSplitToolClick = () => {
    if (splitState === 'inactive') {
      setSplitStartFrame(currentFrame);
      setSplitState('start-set');
    } else if (splitState === 'start-set') {
      setSplitEndFrame(currentFrame);
      setSplitState('end-set');
      setShowSplitModal(true);
    }
  };

  const resetSplitTool = () => {
    setSplitStartFrame(null);
    setSplitEndFrame(null);
    setSplitState('inactive');
    setShowSplitModal(false);
  };

  const handleViewportClick = (e: React.MouseEvent) => {
    if (viewportRef.current && e.target === viewportRef.current) {
      setShowAnnotationPanel(!showAnnotationPanel);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculatePosition = (start: number, end: number) => {
    const totalDuration = 48 * 60; // 48 seconds * 60 frames per second
    const startPos = (start / totalDuration) * 100;
    const width = ((end - start) / totalDuration) * 100;
    return { startPos, width };
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-200">
      {/* Top Status Bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 h-12">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FileOutlined className="text-blue-400" />
            <span className="text-sm">File: task_001_walk.bvh</span>
          </div>
          <div className="flex items-center space-x-2">
            <ClockCircleOutlined className="text-blue-400" />
            <span className="text-sm">Duration: 04:12</span>
          </div>
          <div className="flex items-center space-x-2">
            <VideoCameraOutlined className="text-blue-400" />
            <ProjectOutlined className="text-blue-400" />
            <span className="text-sm">Type: B (Video+BVH)</span>
          </div>
        </div>
        <div className="text-lg font-medium">
          <span className="cursor-pointer hover:text-blue-400">Frame {currentFrame}</span>
          <span>/ {totalFrames}</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            type="text" 
            className="flex items-center space-x-1 bg-gray-700 hover:bg-gray-600 rounded-button whitespace-nowrap"
            icon={<ForwardOutlined />}
          >
            <span className="text-sm">跳过此文件</span>
          </Button>
          <Button 
            type="text" 
            className="flex items-center space-x-1 bg-gray-700 hover:bg-gray-600 rounded-button whitespace-nowrap"
            icon={<KeyboardOutlined />}
          >
            <span className="text-sm">快捷键了解</span>
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex flex-1 overflow-hidden" style={{ height: '65vh' }}>
        {/* Left 3D Visualization Area */}
        <div 
          className="flex-1 relative bg-gray-700"
          ref={viewportRef}
          onClick={handleViewportClick}
        >
          <div className="absolute top-2 right-2 z-10 flex space-x-2">
            <Button 
              type="text" 
              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded-button whitespace-nowrap text-xs"
              icon={<RobotOutlined />}
            >
              <span>机器人叠加层</span>
            </Button>
            <Button 
              type="text" 
              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded-button whitespace-nowrap text-xs"
              icon={<VideoCameraOutlined />}
            >
              <span>视频背景</span>
            </Button>
          </div>

          {/* 3D View Container */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="relative w-full h-full">
              {/* Placeholder for 3D rendering */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-600">
                <ProjectOutlined className="text-6xl text-blue-400 opacity-30" />
              </div>

              {/* Video Window Example */}
              <div className="absolute bottom-4 right-4 w-72 h-48 bg-gray-800 border border-gray-600 rounded">
                <div className="flex justify-between items-center px-3 py-2 bg-gray-700 border-b border-gray-600">
                  <span className="text-sm">第三方视角视频</span>
                  <CloseOutlined className="cursor-pointer hover:text-red-400 text-xs" />
                </div>
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-700">
                  <VideoCameraOutlined className="text-4xl text-blue-400 opacity-30" />
                </div>
              </div>

              {/* Time Shadow Example */}
              <div 
                className="absolute top-0 left-0 w-full h-full bg-blue-400 bg-opacity-10 pointer-events-none"
                style={{ left: '30%', width: '20%' }}
              />
            </div>
          </div>
        </div>

        {/* Right Toolbar */}
        <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="flex justify-between items-center px-3 py-2 border-b border-gray-700">
            <h3 className="text-sm font-medium">标注工具</h3>
            <Button 
              type="text" 
              icon={<LeftOutlined />} 
              className="text-gray-400 hover:text-white"
            />
          </div>

          <div className="p-2 grid grid-cols-4 gap-2 border-b border-gray-700">
            <Button 
              type="text" 
              className={`w-8 h-8 flex items-center justify-center rounded ${activeTool === 'select' ? 'bg-blue-500 bg-opacity-50' : 'bg-gray-700 hover:bg-gray-600'}`}
              icon={<ProjectOutlined />}
              title="选择工具"
              onClick={() => setActiveTool('select')}
            />
            <Button 
              type="text" 
              className="w-8 h-8 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600"
              icon={<PlusCircleOutlined />}
              title="插入时间点"
            />
            <Button 
              type="text" 
              className="w-8 h-8 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600"
              icon={<MinusCircleOutlined />}
              title="删除时间点"
            />
            <Button 
              type="text" 
              className={`w-8 h-8 flex items-center justify-center rounded ${splitState !== 'inactive' ? 'bg-blue-500 bg-opacity-50' : 'bg-gray-700 hover:bg-gray-600'}`}
              icon={<ScissorOutlined />}
              title={splitState === 'inactive' ? '分割切片 - 点击设置起始点' : 
                    splitState === 'start-set' ? '分割切片 - 点击设置结束点' : 
                    '分割切片 - 点击确认或取消'}
              onClick={handleSplitToolClick}
            />
            <Button 
              type="text" 
              className="w-8 h-8 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600"
              icon={<GroupOutlined />}
              title="合并切片"
            />
            <Button 
              type="text" 
              className="w-8 h-8 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600"
              icon={<ExclamationCircleOutlined />}
              title="标记问题"
            />
            <Button 
              type="text" 
              className="w-8 h-8 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600"
              icon={<CommentOutlined />}
              title="添加注释"
            />
            <Button 
              type="text" 
              className="w-8 h-8 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600"
              icon={<RulerOutlined />}
              title="测量工具"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-2 border-b border-gray-700">
              <h3 className="text-sm font-medium">切片列表</h3>
            </div>
            <div className="divide-y divide-gray-700">
              {segments.map(segment => (
                <div key={segment.id} className="px-3 py-2 hover:bg-gray-700 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">#{segment.id} {segment.name}</span>
                    <span className="text-xs text-gray-400">
                      {formatTime(segment.start)}-{formatTime(segment.end)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Level 1: {segment.level1} | Level 2: {segment.level2}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Annotation Panel */}
        <div 
          ref={annotationPanelRef}
          className={`absolute right-0 top-0 h-full w-64 bg-gray-800 border-l border-gray-700 shadow-lg transition-transform duration-200 ${showAnnotationPanel ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-4">
            <h3 className="text-sm font-medium mb-2">新建时间切片</h3>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">开始时间</span>
                <div className="flex items-center">
                  <Input 
                    className="w-16 bg-gray-700 border border-gray-600 px-2 py-1 text-sm rounded"
                    defaultValue="00:12"
                  />
                  <span className="text-xs text-gray-400 ml-1">(Frame 360)</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">结束时间</span>
                <div className="flex items-center">
                  <Input 
                    className="w-16 bg-gray-700 border border-gray-600 px-2 py-1 text-sm rounded"
                    defaultValue="00:18"
                  />
                  <span className="text-xs text-gray-400 ml-1">(Frame 540)</span>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1">一级动作分类</label>
              <Select
                className="w-full"
                defaultValue="移动"
                options={[
                  { value: '移动', label: '移动' },
                  { value: '静止', label: '静止' },
                  { value: '操作', label: '操作' },
                  { value: '交互', label: '交互' },
                  { value: '其他', label: '其他' }
                ]}
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1">二级动作分类</label>
              <Select
                className="w-full"
                defaultValue="行走"
                options={[
                  { value: '行走', label: '行走' },
                  { value: '跑步', label: '跑步' },
                  { value: '转身', label: '转身' },
                  { value: '跳跃', label: '跳跃' }
                ]}
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1">脚本内容</label>
              <div className="bg-gray-700 border border-gray-600 p-2 text-xs rounded h-24 overflow-y-auto">
                <p className="mb-1">00:12 - 00:18: 角色从当前位置转身90度面向右侧的桌子，准备拾取桌上的杯子。</p>
                <p className="text-blue-400">00:15 - 00:17: 右手抬起，准备抓取动作。</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                type="primary" 
                className="flex-1 rounded-button whitespace-nowrap"
              >
                确认添加 (Enter)
              </Button>
              <Button 
                type="text" 
                className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-button whitespace-nowrap"
              >
                取消 (Esc)
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Timeline & Controls */}
      <footer className="bg-gray-800 border-t border-gray-700" style={{ height: '20vh' }}>
        <div className="h-full flex flex-col">
          {/* Thumbnail Track */}
          <div className="h-8 bg-gray-700 px-2 flex items-center">
            <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 w-full" />
            </div>
          </div>

          {/* Segment Track */}
          <div className="flex-1 relative">
            <div className="h-5 bg-gray-700 bg-opacity-20 relative">
              {segments.map(segment => {
                const { startPos, width } = calculatePosition(segment.start, segment.end);
                return (
                  <div 
                    key={segment.id}
                    className="absolute h-full bg-green-500 bg-opacity-30 border-l-2 border-green-500 border-r-2 border-red-500"
                    style={{ left: `${startPos}%`, width: `${width}%` }}
                  >
                    <div 
                      className="absolute top-1/2 w-2 h-2 rounded-full bg-green-500 transform -translate-y-1/2 -translate-x-1/2"
                      style={{ left: '0%' }}
                    />
                    <div 
                      className="absolute top-1/2 w-2 h-2 rounded-full bg-red-500 transform -translate-y-1/2 -translate-x-1/2"
                      style={{ left: '100%' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Playback Controls */}
          <div className="h-12 bg-gray-700 flex items-center justify-center px-4">
            <div className="flex items-center space-x-4">
              <Button 
                type="text" 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-600 hover:bg-gray-500"
                icon={<StepBackwardOutlined />}
              />
              <Button 
                type="text" 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-600 hover:bg-gray-500"
                icon={<BackwardOutlined />}
              />
              <Button 
                type="text" 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600"
                icon={isPlaying ? <ForwardFilled /> : <PlayCircleOutlined />}
                onClick={() => setIsPlaying(!isPlaying)}
              />
              <Button 
                type="text" 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-600 hover:bg-gray-500"
                icon={<ArrowRightOutlined />}
              />
              <Button 
                type="text" 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-600 hover:bg-gray-500"
                icon={<StepForwardOutlined />}
              />
              <div className="flex items-center space-x-2 ml-4">
                <span className="text-xs">速度:</span>
                <Select
                  className="w-20"
                  defaultValue="1x"
                  options={[
                    { value: 0.5, label: '0.5x' },
                    { value: 1, label: '1x' },
                    { value: 2, label: '2x' },
                    { value: 4, label: '4x' }
                  ]}
                  onChange={(value) => setPlaybackSpeed(value)}
                />
              </div>
              <div className="flex-1 mx-4">
                <Slider 
                  className="m-0"
                  tooltip={{ formatter: (value) => formatTime(value || 0) }}
                  min={0}
                  max={48 * 60}
                  value={currentFrame}
                  onChange={(value) => setCurrentFrame(value)}
                  trackStyle={{ backgroundColor: '#3b82f6' }}
                  railStyle={{ backgroundColor: '#4b5563' }}
                />
              </div>
              <div className="text-xs">
                <span>{formatTime(currentFrame / 60)}</span>
                <span>/ 04:12</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Split Modal */}
      <Modal
        title={`分割切片 (${splitStartFrame}-${splitEndFrame})`}
        open={showSplitModal}
        onCancel={resetSplitTool}
        footer={[
          <Button key="cancel" onClick={resetSplitTool}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={resetSplitTool}>
            确认
          </Button>,
        ]}
      >
        <div className="mb-4">
          <label className="block text-sm mb-1">动作描述</label>
          <Input placeholder="输入动作描述" />
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">一级分类</label>
          <Select
            className="w-full"
            defaultValue="移动"
            options={[
              { value: '移动', label: '移动' },
              { value: '静止', label: '静止' },
              { value: '操作', label: '操作' },
              { value: '交互', label: '交互' }
            ]}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">二级分类</label>
          <Select
            className="w-full"
            defaultValue="行走"
            options={[
              { value: '行走', label: '行走' },
              { value: '跑步', label: '跑步' },
              { value: '转身', label: '转身' },
              { value: '跳跃', label: '跳跃' }
            ]}
          />
        </div>
      </Modal>
    </div>
  );
};

export default App;

