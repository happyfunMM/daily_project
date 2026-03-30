import { MousePointer2, Scissors, Tag, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export type ToolType = 'select' | 'slice' | 'label' | 'quality';

interface FloatingToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  canUseLabel: boolean;
  isQualityMode?: boolean;
  onQualityPass?: () => void;
  onQualityFailRescan?: () => void;
  onQualityFailDiscard?: () => void;
  selectedSlice?: any;
}

export function FloatingToolbar({ activeTool, onToolChange, canUseLabel, isQualityMode, onQualityPass, onQualityFailRescan, onQualityFailDiscard, selectedSlice }: FloatingToolbarProps) {
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-2xl p-2 flex flex-col gap-2">
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
                    : 'hover:bg-muted text-foreground'
                }
              >
                <MousePointer2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>选择工具</p>
              <p className="text-xs text-muted-foreground">点击切片进行选择和编辑</p>
            </TooltipContent>
          </Tooltip>

          {!isQualityMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={activeTool === 'slice' ? 'default' : 'ghost'}
                  onClick={() => onToolChange('slice')}
                  className={
                    activeTool === 'slice'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'hover:bg-muted text-foreground'
                  }
                >
                  <Scissors className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>切片工具</p>
                <p className="text-xs text-muted-foreground">创建切片和添加标注</p>
              </TooltipContent>
            </Tooltip>
          )}

          {isQualityMode && (
            <>
              {selectedSlice && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={onQualityPass}
                        className="bg-green-600 hover:bg-green-700 text-xs"
                      >
                        通过
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>通过</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={onQualityFailRescan}
                        className="bg-red-600 hover:bg-red-700 text-xs"
                      >
                        不通过-重标
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>不通过：重标</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={onQualityFailDiscard}
                        className="bg-gray-600 hover:bg-gray-700 text-xs"
                      >
                        不通过-丢弃
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>不通过：丢弃</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
}
