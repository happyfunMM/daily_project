import { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TopBar } from './components/TopBar';
import { BVHViewer } from './components/BVHViewer';
import { ScriptViewer } from './components/ScriptViewer';
import { Timeline } from './components/Timeline';
import { FloatingToolbar, ToolType } from './components/FloatingToolbar';
import { AnnotationDialog } from './components/AnnotationDialog';
import { ResizableDraggableWindow, MinimizedIcon } from './components/ResizableDraggableWindow';
import { ShortcutsDialog } from './components/ShortcutsDialog';
import { FileInfo, Slice, DataType } from './types';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';

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
    },
    {
      id: 'slice-2',
      start: 1200,
      end: 1800,
      level1: '弯腰',
      level2: '拾取地面物品',
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

  // Playback loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        const next = prev + playbackSpeed;
        if (next >= MOCK_FILE_INFO.totalFrames) {
          setIsPlaying(false);
          return MOCK_FILE_INFO.totalFrames - 1;
        }
        return next;
      });
    }, 1000 / MOCK_FILE_INFO.fps);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

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
        case '[':
          handlePrevSlice();
          break;
        case ']':
          handleNextSlice();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedSlice]);

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
  const handleSlicePointClick = (frame: number) => {
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
      setPendingSliceStart(null);
      toast.success('已插入结束点，请使用标签工具添加标注');
      
      // Auto switch to label tool
      setActiveTool('label');
    }
  };

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    
    // If switching to label tool and there's a pending slice, open dialog
    if (tool === 'label' && pendingSlice) {
      setShowAnnotationDialog(true);
    }
    
    // If switching away from slice tool, clear pending start
    if (tool !== 'slice') {
      setPendingSliceStart(null);
    }
  };

  const handleSaveAnnotation = (slice: Slice) => {
    setSlices((prev) => [...prev, slice]);
    toast.success('新切片已创建并标注');
    
    setShowAnnotationDialog(false);
    setPendingSlice(null);
    setActiveTool('select');
  };

  const handleCancelAnnotation = () => {
    setShowAnnotationDialog(false);
    // Keep pending slice in case user wants to label it later
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
    if (confirm(`确定提交当前文件的 ${slices.length} 个标注切片吗？`)) {
      toast.success('标注已提交成功！');
      // In real app, submit annotations to backend
    }
  };

  const canUseLabel = pendingSlice !== null;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
        <Toaster />
        
        {/* Top Bar */}
        <TopBar
          fileInfo={MOCK_FILE_INFO}
          currentFrame={currentFrame}
          onPrevFile={handlePrevFile}
          onNextFile={handleNextFile}
          onSubmit={handleSubmit}
          onShowShortcuts={() => setShowShortcuts(true)}
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
          onFrameChange={setCurrentFrame}
          onPlayPause={() => setIsPlaying((prev) => !prev)}
          onSpeedChange={setPlaybackSpeed}
          onSliceClick={handleSliceClick}
          onSliceDelete={handleSliceDelete}
          onSliceUpdate={handleSliceUpdate}
          onSlicePointClick={handleSlicePointClick}
          selectedSlice={selectedSlice}
        />

        {/* Annotation Dialog */}
        <AnnotationDialog
          open={showAnnotationDialog}
          slice={pendingSlice}
          onSave={handleSaveAnnotation}
          onCancel={handleCancelAnnotation}
        />

        {/* Shortcuts Dialog */}
        <ShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
      </div>
    </DndProvider>
  );
}

export default App;