import { Slice } from '../types';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface QualitySidebarProps {
  slices: Slice[];
  selectedSlice: Slice | null;
  onSliceClick: (slice: Slice) => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'passed':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4 text-yellow-500" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'passed':
      return '通过';
    case 'failed':
      return '不通过';
    default:
      return '待质检';
  }
};

export function QualitySidebar({ slices, selectedSlice, onSliceClick }: QualitySidebarProps) {
  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-medium text-foreground">切片列表</h3>
        <p className="text-xs text-muted-foreground">共 {slices.length} 个切片</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {slices.map((slice) => {
          const isSelected = selectedSlice?.id === slice.id;
          return (
            <div
              key={slice.id}
              className={`p-3 mb-2 rounded border cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-border hover:border-blue-300'}`}
              onClick={() => onSliceClick(slice)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground text-sm truncate max-w-[180px] hover:whitespace-normal hover:max-w-none">{slice.level1} - {slice.level2}</span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(slice.qualityStatus || 'pending')}
                  <span className="text-xs text-muted-foreground">{getStatusText(slice.qualityStatus || 'pending')}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                帧: {slice.start} - {slice.end}
              </div>
              <div className="text-xs text-muted-foreground">
                时长: {Math.floor((slice.end - slice.start) / 30 * 100) / 100} 秒
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
