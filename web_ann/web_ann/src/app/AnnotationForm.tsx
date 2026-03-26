import { useState, useEffect } from 'react';
import { Slice } from '../types';
import { Button } from './ui/button';

interface AnnotationFormProps {
  slice: Slice | null;
  onUpdate: (slice: Slice) => void;
  totalFrames: number;
  onCancel: () => void;
}

export function AnnotationForm({ slice, onUpdate, totalFrames, onCancel }: AnnotationFormProps) {
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [level1, setLevel1] = useState('');
  const [level2, setLevel2] = useState('');

  useEffect(() => {
    if (slice) {
      setStart(slice.start);
      setEnd(slice.end);
      setLevel1(slice.level1 || '');
      setLevel2(slice.level2 || '');
    } else {
      setStart(0);
      setEnd(0);
      setLevel1('');
      setLevel2('');
    }
  }, [slice]);

  if (!slice) {
    return (
      <div className="h-[5vh] min-h-[50px] bg-card border-t border-border flex items-center justify-center">
        <span className="text-muted-foreground text-sm">请选择一个切片进行编辑</span>
      </div>
    );
  }

  const handleUpdate = () => {
    if (slice) {
      // Ensure start is less than end and both are within bounds
      const validStart = Math.max(0, Math.min(totalFrames - 1, start));
      const validEnd = Math.max(validStart + 1, Math.min(totalFrames, end));
      
      onUpdate({
        ...slice,
        start: validStart,
        end: validEnd,
        level1,
        level2
      });
    }
  };

  return (
    <div className="h-[5vh] min-h-[50px] bg-card border-t border-border flex items-center px-4 gap-4">
      {/* Time Range */}
      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <label className="text-[10px] text-muted-foreground whitespace-nowrap">时间范围</label>
        <div className="flex gap-1 flex-1">
          <input
            type="number"
            value={start}
            onChange={(e) => setStart(Number(e.target.value))}
            onBlur={handleUpdate}
            min="0"
            max={totalFrames - 1}
            className="w-16 text-xs h-6 p-0.5 border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="开始"
          />
          <span className="flex items-center text-xs">-</span>
          <input
            type="number"
            value={end}
            onChange={(e) => setEnd(Number(e.target.value))}
            onBlur={handleUpdate}
            min={start + 1}
            max={totalFrames}
            className="w-16 text-xs h-6 p-0.5 border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="结束"
          />
        </div>
      </div>

      {/* Task Name */}
      <div className="flex items-center gap-2 flex-1 min-w-[150px]">
        <label className="text-[10px] text-muted-foreground whitespace-nowrap">任务名称</label>
        <input
          type="text"
          value={level1}
          onChange={(e) => setLevel1(e.target.value)}
          onBlur={handleUpdate}
          className="w-full text-xs h-6 p-0.5 border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="任务名称"
        />
      </div>

      {/* Task Description */}
      <div className="flex items-center gap-2 flex-1 min-w-[150px]">
        <label className="text-[10px] text-muted-foreground whitespace-nowrap">任务描述</label>
        <input
          type="text"
          value={level2}
          onChange={(e) => setLevel2(e.target.value)}
          onBlur={handleUpdate}
          className="w-full text-xs h-6 p-0.5 border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="任务描述"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="text-xs h-6"
        >
          取消
        </Button>
        <Button
          size="sm"
          onClick={handleUpdate}
          className="text-xs h-6 bg-green-600 hover:bg-green-700 text-white"
        >
          保存
        </Button>
      </div>
    </div>
  );
}
