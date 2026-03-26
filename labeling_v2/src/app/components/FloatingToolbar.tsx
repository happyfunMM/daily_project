import { MousePointer2, Scissors, Tag } from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export type ToolType = 'select' | 'slice' | 'label';

interface FloatingToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  canUseLabel: boolean;
}

export function FloatingToolbar({ activeTool, onToolChange, canUseLabel }: FloatingToolbarProps) {
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
      <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl p-2 flex flex-col gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={activeTool === 'select' ? 'default' : 'ghost'}
                onClick={() => onToolChange('select')}
                className={
                  activeTool === 'select'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'hover:bg-slate-800 text-slate-300'
                }
              >
                <MousePointer2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>选择工具</p>
              <p className="text-xs text-slate-400">点击切片进行选择和编辑</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={activeTool === 'slice' ? 'default' : 'ghost'}
                onClick={() => onToolChange('slice')}
                className={
                  activeTool === 'slice'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'hover:bg-slate-800 text-slate-300'
                }
              >
                <Scissors className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>切片工具</p>
              <p className="text-xs text-slate-400">在时间轴点击插入开始/结束点</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={activeTool === 'label' ? 'default' : 'ghost'}
                onClick={() => onToolChange('label')}
                disabled={!canUseLabel}
                className={
                  activeTool === 'label'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'hover:bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed'
                }
              >
                <Tag className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>标签工具</p>
              <p className="text-xs text-slate-400">
                {canUseLabel ? '为当前切片添加标注' : '请先使用切片工具创建切片'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
