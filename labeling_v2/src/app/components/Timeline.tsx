import { useRef, useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Slice } from '../types';
import { ToolType } from './FloatingToolbar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from './ui/context-menu';

interface TimelineProps {
  currentFrame: number;
  totalFrames: number;
  slices: Slice[];
  isPlaying: boolean;
  playbackSpeed: number;
  activeTool: ToolType;
  pendingSliceStart: number | null;
  onFrameChange: (frame: number) => void;
  onPlayPause: () => void;
  onSpeedChange: (speed: number) => void;
  onSliceClick: (slice: Slice) => void;
  onSliceDelete: (sliceId: string) => void;
  onSliceUpdate: (slice: Slice) => void;
  onSlicePointClick: (frame: number) => void;
  selectedSlice: Slice | null;
}

export function Timeline({
  currentFrame,
  totalFrames,
  slices,
  isPlaying,
  playbackSpeed,
  activeTool,
  pendingSliceStart,
  onFrameChange,
  onPlayPause,
  onSpeedChange,
  onSliceClick,
  onSliceDelete,
  onSliceUpdate,
  onSlicePointClick,
  selectedSlice,
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'playhead' | 'slice-start' | 'slice-end' | null>(null);
  const [dragSlice, setDragSlice] = useState<Slice | null>(null);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frame = Math.floor((x / rect.width) * totalFrames);
    const clampedFrame = Math.max(0, Math.min(totalFrames - 1, frame));

    // If slice tool is active, handle slice point insertion
    if (activeTool === 'slice') {
      onSlicePointClick(clampedFrame);
    } else {
      // Otherwise, just seek to the frame
      onFrameChange(clampedFrame);
    }
  };

  const handleSliceEdgeMouseDown = (e: React.MouseEvent, slice: Slice, type: 'start' | 'end') => {
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type === 'start' ? 'slice-start' : 'slice-end');
    setDragSlice(slice);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const frame = Math.floor((x / rect.width) * totalFrames);
      const clampedFrame = Math.max(0, Math.min(totalFrames - 1, frame));

      if (dragType === 'slice-start' && dragSlice) {
        onSliceUpdate({ ...dragSlice, start: Math.min(clampedFrame, dragSlice.end - 1) });
      } else if (dragType === 'slice-end' && dragSlice) {
        onSliceUpdate({ ...dragSlice, end: Math.max(clampedFrame, dragSlice.start + 1) });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
      setDragSlice(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragType, dragSlice, totalFrames]);

  const handlePrevSlice = () => {
    const prevSlices = slices.filter(s => s.end < currentFrame).sort((a, b) => b.end - a.end);
    if (prevSlices.length > 0) {
      onFrameChange(prevSlices[0].start);
    }
  };

  const handleNextSlice = () => {
    const nextSlices = slices.filter(s => s.start > currentFrame).sort((a, b) => a.start - b.start);
    if (nextSlices.length > 0) {
      onFrameChange(nextSlices[0].start);
    }
  };

  return (
    <div className="h-[20vh] min-h-[180px] bg-slate-900 border-t border-slate-700 flex flex-col">
      {/* Timeline Track */}
      <div className="flex-1 px-4 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            时间轴 {activeTool === 'slice' && <span className="text-green-400">- 切片模式: 点击插入开始/结束点</span>}
          </span>
          <span className="text-xs text-slate-400">
            {Math.floor(currentFrame / 30 / 60)}:{String(Math.floor((currentFrame / 30) % 60)).padStart(2, '0')}
          </span>
        </div>

        {/* Timeline Container */}
        <div
          ref={timelineRef}
          className="relative h-16 bg-slate-800 rounded cursor-pointer border border-slate-700"
          onClick={handleTimelineClick}
        >
          {/* Frame markers */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 border-l border-slate-700/50"
                style={{ marginLeft: i === 0 ? 0 : undefined }}
              />
            ))}
          </div>

          {/* Slices */}
          {slices.map((slice) => {
            const left = (slice.start / totalFrames) * 100;
            const width = ((slice.end - slice.start) / totalFrames) * 100;
            const isSelected = selectedSlice?.id === slice.id;

            return (
              <ContextMenu key={slice.id}>
                <ContextMenuTrigger>
                  <div
                    className={`absolute top-0 h-full cursor-pointer transition-all ${
                      isSelected ? 'bg-green-500/60 ring-2 ring-green-400' : 'bg-green-500/30 hover:bg-green-500/40'
                    }`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeTool === 'select') {
                        onSliceClick(slice);
                      }
                    }}
                  >
                    {/* Start marker */}
                    <div
                      className="absolute left-0 top-0 h-full w-1 bg-green-600 cursor-ew-resize hover:w-2 transition-all"
                      onMouseDown={(e) => handleSliceEdgeMouseDown(e, slice, 'start')}
                    />
                    {/* End marker */}
                    <div
                      className="absolute right-0 top-0 h-full w-1 bg-red-600 cursor-ew-resize hover:w-2 transition-all"
                      onMouseDown={(e) => handleSliceEdgeMouseDown(e, slice, 'end')}
                    />
                    {/* Labels */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-white font-medium truncate px-2">
                        {slice.level1} - {slice.level2}
                      </span>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => onSliceClick(slice)}>
                    编辑切片
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => onSliceDelete(slice.id)}
                    className="text-red-400"
                  >
                    删除切片
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}

          {/* Pending slice start point */}
          {pendingSliceStart !== null && (
            <div
              className="absolute top-0 h-full w-1 bg-green-500 pointer-events-none"
              style={{ left: `${(pendingSliceStart / totalFrames) * 100}%` }}
            >
              <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-green-500 rounded-full" />
            </div>
          )}

          {/* Playhead */}
          <div
            className="absolute top-0 h-full w-0.5 bg-yellow-400 pointer-events-none z-10"
            style={{ left: `${(currentFrame / totalFrames) * 100}%` }}
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-yellow-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="px-4 py-3 bg-slate-950 border-t border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrevSlice}
            className="bg-slate-800 border-slate-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onFrameChange(Math.max(0, currentFrame - 1))}
            className="bg-slate-800 border-slate-600"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            onClick={onPlayPause}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onFrameChange(Math.min(totalFrames - 1, currentFrame + 1))}
            className="bg-slate-800 border-slate-600"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleNextSlice}
            className="bg-slate-800 border-slate-600"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">速度:</span>
            {[1, 2, 4].map((speed) => (
              <Button
                key={speed}
                size="sm"
                variant={playbackSpeed === speed ? 'default' : 'outline'}
                onClick={() => onSpeedChange(speed)}
                className={
                  playbackSpeed === speed
                    ? 'bg-blue-600'
                    : 'bg-slate-800 border-slate-600'
                }
              >
                {speed}x
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}