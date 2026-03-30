import { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TopBar } from './components/TopBar';
import { BVHViewer } from './components/BVHViewer';
import { ScriptViewer } from './components/ScriptViewer';
import { Timeline } from './components/Timeline';
import { FloatingToolbar } from './components/FloatingToolbar';
import { ResizableDraggableWindow, MinimizedIcon } from './components/ResizableDraggableWindow';
import { ShortcutsDialog } from './components/ShortcutsDialog';
import { QualitySidebar } from './components/QualitySidebar';
import { FileInfo, Slice, DataType, ToolType, QualityStatus, QualityResult } from './types';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';

// Mock data
const MOCK_FILE_INFO: FileInfo = {
  fileName: 'task_001_walk.bvh',
  duration: '04:12',
  type: 'C', // BVH + Video + Script
  totalFrames: 7560, // 4:12 at 30fps
  fps: 30,
};

function App() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [slices, setSlices] = useState<Slice[]>([
    {
      id: 'slice-1',
      start: 300,
      end: 900,
      level1: '行走',
      level2: '正常行走',
      qualityStatus: 'pending',
    },
    {
      id: 'slice-2',
      start: 1200,
      end: 1800,
      level1: '弯腰',
      level2: '拾取地面物品',
      qualityStatus: 'pending',
    },
  ]);
  const [selectedSlice, setSelectedSlice] = useState<Slice | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isScriptMinimized, setIsScriptMinimized] = useState(false);
  
  // New tool system
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [pendingSliceStart, setPendingSliceStart] = useState<number | null>(null);
  const [pendingSlice, setPendingSlice] = useState<Slice | null>(null);
  const [showAnnotationDialog, setShowAnnotationDialog] = useState(false);
  const [editingSlice, setEditingSlice] = useState<Slice | null>(null);
  
  // Quality inspection mode
  const [isQualityMode, setIsQualityMode] = useState(false);
  const [qualityResult, setQualityResult] = useState<QualityResult>({
    totalSlices: 0,
    passedSlices: 0,
    failedSlices: 0,
    pendingSlices: 0,
  });

  // Playback loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        const next = prev + Math.round(playbackSpeed); // 根据播放速度调整
        if (next >= MOCK_FILE_INFO.totalFrames) {
          setIsPlaying(false);
          return MOCK_FILE_INFO.totalFrames - 1;
        }
        return next;
      });
    }, 1000 / MOCK_FILE_INFO.fps);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // Calculate quality inspection result
  useEffect(() => {
    const total = slices.length;
    const passed = slices.filter(s => s.qualityStatus === 'passed').length;
    const failed = slices.filter(s => s.qualityStatus === 'failed').length;
    const pending = slices.filter(s => s.qualityStatus === 'pending').length;
    
    setQualityResult({
      totalSlices: total,
      passedSlices: passed,
      failedSlices: failed,
      pendingSlices: pending,
    });
  }, [slices]);

  const handlePrevSlice = () => {
    const prevSlices = slices.filter(s => s.end < currentFrame).sort((a, b) => b.end - a.end);
    if (prevSlices.length > 0) {
      setCurrentFrame(prevSlices[0].start);
    }
  };

  const handleNextSlice = () => {
    const nextSlices = slices.filter(s => s.start > currentFrame).sort((a, b) => a.start - b.start);
    if (nextSlices.length > 0) {
      setCurrentFrame(nextSlices[0].start);
    }
  };

  const handleSliceClick = (slice: Slice) => {
    setSelectedSlice(slice);
    setCurrentFrame(slice.start);
    setActiveTool('slice');
  };

  const handleEditSlice = (slice: Slice) => {
    setSelectedSlice(slice);
    setEditingSlice(slice);
  };

  const handleSliceDelete = (sliceId: string) => {
    setSlices((prev) => prev.filter((s) => s.id !== sliceId));
    if (selectedSlice?.id === sliceId) {
      setSelectedSlice(null);
    }
    if (pendingSlice?.id === sliceId) {
      setPendingSlice(null);
      setPendingSliceStart(null);
    }
    toast.success('切片已删除');
  };

  const handleSliceUpdate = (updatedSlice: Slice) => {
    setSlices((prev) =>
      prev.map((s) => (s.id === updatedSlice.id ? updatedSlice : s))
    );
    if (selectedSlice?.id === updatedSlice.id) {
      setSelectedSlice(updatedSlice);
    }
  };

  // Handle slice point click from timeline (when slice tool is active)
  const handleSlicePointClick = useCallback((frame: number) => {
    if (pendingSliceStart === null) {
      // First click: set start point
      setPendingSliceStart(frame);
      toast.info('已插入起始点，请点击设置结束点');
    } else {
      // Second click: set end point and create pending slice
      const start = Math.min(pendingSliceStart, frame);
      const end = Math.max(pendingSliceStart, frame);
      
      if (end - start < 1) {
        toast.error('切片长度太短，请重新选择');
        setPendingSliceStart(null);
        return;
      }

      const newSlice: Slice = {
        id: `slice-${Date.now()}`,
        start,
        end,
        level1: '',
        level2: '',
      };
      
      setPendingSlice(newSlice);
      setEditingSlice(newSlice);
      // 不清除 pendingSliceStart，保留开始点的绿色竖线
      toast.success('已插入结束点，请填写切片信息');
    }
  }, [pendingSliceStart]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentFrame((prev) => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCurrentFrame((prev) => Math.min(MOCK_FILE_INFO.totalFrames - 1, prev + 1));
          break;
        case '1':
          setPlaybackSpeed(1);
          break;
        case '2':
          setPlaybackSpeed(2);
          break;
        case '4':
          setPlaybackSpeed(4);
          break;
        case 'Escape':
          setShowAnnotationDialog(false);
          setPendingSlice(null);
          setPendingSliceStart(null);
          break;
        case 'Delete':
          if (selectedSlice) {
            handleSliceDelete(selectedSlice.id);
          }
          break;
        case 's':
          // Insert slice point at current frame
          if (activeTool === 'slice') {
            handleSlicePointClick(currentFrame);
          }
          break;
        case '[':
          handlePrevSlice();
          break;
        case ']':
          handleNextSlice();
          break;
        case 'q':
          setIsQualityMode((prev) => !prev);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedSlice, activeTool, currentFrame, handleSlicePointClick]);

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    
    // If switching to label tool and there's a pending slice, set editing slice
    if (tool === 'label' && pendingSlice) {
      setEditingSlice(pendingSlice);
    }
    
    // If switching away from slice tool, clear pending start and pending slice
    if (tool !== 'slice') {
      setPendingSliceStart(null);
      setPendingSlice(null);
    }
  };

  const handleSaveAnnotation = (slice: Slice) => {
    const existingSlice = slices.find(s => s.id === slice.id);
    
    if (existingSlice) {
      // 更新现有切片
      setSlices((prev) => prev.map(s => s.id === slice.id ? {
        ...slice,
        qualityStatus: s.qualityStatus
      } : s));
      toast.success('切片已更新');
    } else {
      // 添加新切片
      const newSlice = {
        ...slice,
        qualityStatus: 'pending'
      };
      setSlices((prev) => [...prev, newSlice]);
      setSelectedSlice(newSlice);
      toast.success('新切片已创建并标注');
    }
    
    setEditingSlice(null);
    setPendingSlice(null);
    setPendingSliceStart(null); // 清除开始点，完成一次切片标注动作
    setActiveTool('slice');
  };

  const handleCancelAnnotation = () => {
    setShowAnnotationDialog(false);
    // 取消时不保留切片
    setPendingSlice(null);
    setPendingSliceStart(null); // 清除开始点和结束点
    setEditingSlice(null);
    setSelectedSlice(null);
  };

  const handlePrevFile = () => {
    toast.info('加载上一个文件');
    // In real app, load previous file
  };

  const handleNextFile = () => {
    toast.info('加载下一个文件');
    // In real app, load next file
  };

  const handleSubmit = () => {
    if (slices.length === 0) {
      toast.error('请至少添加一个标注切片后再提交');
      return;
    }
    
    // 检查是否有切片的动作名称或动作描述为空
    const invalidSlices = slices.filter(slice => !slice.level1 || !slice.level2);
    if (invalidSlices.length > 0) {
      toast.error('请填写所有切片的动作名称和动作描述');
      return;
    }
    
    if (confirm(`确定提交当前文件的 ${slices.length} 个标注切片吗？`)) {
      toast.success('标注已提交成功！');
      // In real app, submit annotations to backend
    }
  };

  // Handle quality inspection status update
  const handleQualityUpdate = (sliceId: string, status: QualityStatus) => {
    setSlices((prev) => prev.map((s) => 
      s.id === sliceId ? { ...s, qualityStatus: status } : s
    ));
    
    let statusText = '待质检';
    switch (status) {
      case 'passed':
        statusText = '通过';
        break;
      case 'failed_rescan':
        statusText = '不通过：重标';
        break;
      case 'failed_discard':
        statusText = '不通过：丢弃';
        break;
    }
    toast.success(`切片质检状态已更新为：${statusText}`);
  };

  const canUseLabel = pendingSlice !== null;

  const handleQualityPass = () => {
    if (selectedSlice) {
      handleQualityUpdate(selectedSlice.id, 'passed');
    }
  };

  const handleQualityFailRescan = () => {
    if (selectedSlice) {
      handleQualityUpdate(selectedSlice.id, 'failed_rescan');
    }
  };

  const handleQualityFailDiscard = () => {
    if (selectedSlice) {
      handleQualityUpdate(selectedSlice.id, 'failed_discard');
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
        <Toaster />
        
        {/* Top Bar */}
        <TopBar
          fileInfo={MOCK_FILE_INFO}
          currentFrame={currentFrame}
          onPrevFile={handlePrevFile}
          onNextFile={handleNextFile}
          onSubmit={handleSubmit}
          onShowShortcuts={() => setShowShortcuts(true)}
          qualityResult={qualityResult}
          isQualityMode={isQualityMode}
          onToggleQualityMode={() => setIsQualityMode((prev) => !prev)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* BVH Viewer */}
          <div className="flex-1 p-4 relative">
            <div className="w-full h-full relative">
              {/* Main BVH Viewer */}
              <BVHViewer
                currentFrame={currentFrame}
                totalFrames={MOCK_FILE_INFO.totalFrames}
                slices={slices}
                showAnnotatedOverlay={true}
              />

              {/* Top Right Controls */}
              <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                {/* Minimized Script Icon */}
                {MOCK_FILE_INFO.type === 'C' && isScriptMinimized && (
                  <MinimizedIcon
                    title="原始脚本文件"
                    onClick={() => setIsScriptMinimized(false)}
                  />
                )}
              </div>

              {/* Floating Script Window (Type C only) */}
              {MOCK_FILE_INFO.type === 'C' && !isScriptMinimized && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="pointer-events-auto">
                    <ResizableDraggableWindow
                      title="原始脚本文件"
                      defaultWidth={350}
                      defaultHeight={400}
                      defaultX={50}
                      defaultY={50}
                      onMinimize={setIsScriptMinimized}
                    >
                      <ScriptViewer />
                    </ResizableDraggableWindow>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Floating Toolbar */}
          <FloatingToolbar
            activeTool={activeTool}
            onToolChange={handleToolChange}
            canUseLabel={canUseLabel}
            isQualityMode={isQualityMode}
            onQualityPass={handleQualityPass}
            onQualityFailRescan={handleQualityFailRescan}
            onQualityFailDiscard={handleQualityFailDiscard}
            selectedSlice={selectedSlice}
          />
        </div>

        {/* Bottom: Timeline */}
        <Timeline
          currentFrame={currentFrame}
          totalFrames={MOCK_FILE_INFO.totalFrames}
          slices={slices}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          activeTool={activeTool}
          pendingSliceStart={pendingSliceStart}
          pendingSlice={pendingSlice}
          onFrameChange={setCurrentFrame}
          onPlayPause={() => setIsPlaying((prev) => !prev)}
          onSpeedChange={setPlaybackSpeed}
          onSliceClick={handleSliceClick}
          onEditSlice={handleEditSlice}
          onSliceDelete={handleSliceDelete}
          onSliceUpdate={handleSliceUpdate}
          onSlicePointClick={handleSlicePointClick}
          selectedSlice={selectedSlice}
        />

        {/* Annotation Form */}
        {editingSlice && (
          <div className="bg-card border-t border-border p-2 h-[5vh] min-h-[40px] flex items-center">
            <div className="flex-1 flex items-center gap-4">
              <h3 className="text-xs font-min text-foreground">编辑切片</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">时间范围</Label>
                  <Input
                    type="number"
                    value={editingSlice.start}
                    onChange={(e) => setEditingSlice({ ...editingSlice, start: parseInt(e.target.value) || 0 })}
                    className="w-20 text-xs bg-input-background border-border text-foreground"
                  />
                  <span className="text-xs text-muted-foreground">至</span>
                  <Input
                    type="number"
                    value={editingSlice.end}
                    onChange={(e) => setEditingSlice({ ...editingSlice, end: parseInt(e.target.value) || 0 })}
                    className="w-20 text-xs bg-input-background border-border text-foreground"
                  />
                </div>
                <div className="flex items-center space-x-1">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">动作名称</Label>
                  <Input
                    value={editingSlice.level1}
                    onChange={(e) => setEditingSlice({ ...editingSlice, level1: e.target.value })}
                    placeholder="请输入动作名称"
                    className="text-xs h-6 bg-input-background border-border text-foreground"
                  />
                </div>
                <div className="flex items-center space-x-1">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">动作描述</Label>
                  <Input
                    value={editingSlice.level2}
                    onChange={(e) => setEditingSlice({ ...editingSlice, level2: e.target.value })}
                    placeholder="请输入动作描述"
                    className="text-xs h-6 bg-input-background border-border text-foreground"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleSliceDelete(editingSlice.id);
                      setEditingSlice(null);
                    }}
                    className="text-xs bg-red-600 hover:bg-red-700 text-white"
                  >
                    删除切片
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // 取消时不保留新切片
                      setEditingSlice(null);
                      setSelectedSlice(null);
                      setPendingSlice(null);
                      setPendingSliceStart(null);
                    }}
                    className="text-xs bg-muted border-border hover:bg-accent text-foreground"
                  >
                    取消
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSaveAnnotation(editingSlice)}
                    className="text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    保存
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shortcuts Dialog */}
        <ShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
      </div>
    </DndProvider>
  );
}

export default App;