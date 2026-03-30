import { useRef, useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Slice } from '../types';
import { ToolType } from './FloatingToolbar';

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
  onEditSlice: (slice: Slice) => void;
  onSliceDelete: (sliceId: string) => void;
  onSliceUpdate: (slice: Slice) => void;
  onSlicePointClick: (frame: number) => void;
  selectedSlice: Slice | null;
  pendingSlice: Slice | null;
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
  onEditSlice,
  onSliceDelete,
  onSliceUpdate,
  onSlicePointClick,
  selectedSlice,
  pendingSlice,
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

    // Always seek to the frame on click, slice points are added via 's' key
    onFrameChange(clampedFrame);
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

  // 按开始时间排序切片
  const sortedSlices = [...slices].sort((a, b) => a.start - b.start);

  return (
    <div className="h-[10vh] min-h-[120px] bg-card border-t border-border flex flex-col">
      {/* Timeline Track */}
      <div className="flex-1 px-4 pt-2">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            时间轴 {activeTool === 'slice' && <span className="text-green-500">- 切片模式: 按 S 键插入开始/结束点</span>}
          </span>
          <span className="text-xs text-muted-foreground">
            {Math.floor(currentFrame / 30 / 60)}:{String(Math.floor((currentFrame / 30) % 60)).padStart(2, '0')}
          </span>
        </div>

        {/* Timeline Container */}
        <div
          ref={timelineRef}
          className="relative h-8 bg-muted rounded cursor-pointer border border-border"
          onClick={handleTimelineClick}
        >
          {/* Frame markers */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 border-l border-border/50"
                style={{ marginLeft: i === 0 ? 0 : undefined }}
              />
            ))}
          </div>

          {/* Slices */}
          {sortedSlices.map((slice, index) => {
            const left = (slice.start / totalFrames) * 100;
            const width = ((slice.end - slice.start) / totalFrames) * 100;
            const isSelected = selectedSlice?.id === slice.id;
            const isInvalid = !slice.level1 || !slice.level2;

            return (
              <div key={slice.id}>
                <div
                  className={`absolute top-0 h-full cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-green-500/70 ring-2 ring-green-500' 
                      : isInvalid 
                        ? 'bg-red-500/30 hover:bg-red-500/40 ring-1 ring-red-400' 
                        : 'bg-green-500/20 hover:bg-green-500/30'
                  }`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSliceClick(slice);
                    onEditSlice(slice);
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

                </div>
              </div>
            );
          })}

          {/* Pending slice */}
          {pendingSlice !== null && (
            <div
              className="absolute top-0 h-full bg-green-500/30 hover:bg-green-500/40 transition-all"
              style={{
                left: `${(pendingSlice.start / totalFrames) * 100}%`,
                width: `${((pendingSlice.end - pendingSlice.start) / totalFrames) * 100}%`
              }}
            >
              {/* Start marker */}
              <div className="absolute left-0 top-0 h-full w-1 bg-green-600" />
              {/* End marker */}
              <div className="absolute right-0 top-0 h-full w-1 bg-red-600" />
              {/* Slice number for pending slice */}
              <div className="absolute top-1 left-2">
                <span className="text-xs text-white font-medium">s{sortedSlices.length}</span>
              </div>
            </div>
          )}

          {/* Pending slice start point */}
          {(pendingSliceStart !== null || pendingSlice !== null) && (
            <div
              className="absolute top-0 h-full w-1 bg-green-500 pointer-events-none"
              style={{ left: `${((pendingSlice?.start || pendingSliceStart) / totalFrames) * 100}%` }}
            >
              <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-green-500 rounded-full" />
              <div className="absolute -bottom-1 -left-1.5 w-3 h-3 bg-green-500 rounded-full" />
              <div className="absolute top-1/2 -left-10 text-xs bg-green-500 text-white px-1 rounded">开始</div>
            </div>
          )}

          {/* Pending slice end point */}
          {pendingSlice !== null && (
            <div
              className="absolute top-0 h-full w-1 bg-red-500 pointer-events-none"
              style={{ left: `${(pendingSlice.end / totalFrames) * 100}%` }}
            >
              <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
              <div className="absolute -bottom-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
              <div className="absolute top-1/2 -left-10 text-xs bg-red-500 text-white px-1 rounded">结束</div>
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

        {/* Slice Labels */}
        {selectedSlice && (
          <div className="mt-1 text-xs mb-1">
            <div className="flex flex-wrap gap-2">
              <span className="text-foreground font-medium">
                当前选中: {selectedSlice.level1} - {selectedSlice.level2}
              </span>
              <span className="text-muted-foreground">
                帧范围: {selectedSlice.start} - {selectedSlice.end}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Playback Controls */}
      <div className="px-4 py-1 bg-background border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrevSlice}
            className="bg-muted border-border h-6"
          >
            <ChevronLeft className="w-3 h-3" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onFrameChange(Math.max(0, currentFrame - 1))}
            className="bg-muted border-border h-6"
          >
            <SkipBack className="w-3 h-3" />
          </Button>

          <Button
            size="sm"
            onClick={onPlayPause}
            className="bg-blue-600 hover:bg-blue-700 h-6"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onFrameChange(Math.min(totalFrames - 1, currentFrame + 1))}
            className="bg-muted border-border h-6"
          >
            <SkipForward className="w-3 h-3" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleNextSlice}
            className="bg-muted border-border h-6"
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">速度:</span>
            {[1, 2, 4].map((speed) => (
              <Button
                key={speed}
                size="sm"
                variant={playbackSpeed === speed ? 'default' : 'outline'}
                onClick={() => onSpeedChange(speed)}
                className={
                  playbackSpeed === speed
                    ? 'bg-blue-600 h-6 px-2'
                    : 'bg-muted border-border h-6 px-2'
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