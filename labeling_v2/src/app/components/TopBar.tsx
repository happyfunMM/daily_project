import { Info, Keyboard, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { Button } from './ui/button';
import { FileInfo } from '../types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface TopBarProps {
  fileInfo: FileInfo;
  currentFrame: number;
  onPrevFile: () => void;
  onNextFile: () => void;
  onSubmit: () => void;
  onShowShortcuts: () => void;
}

export function TopBar({ fileInfo, currentFrame, onPrevFile, onNextFile, onSubmit, onShowShortcuts }: TopBarProps) {
  return (
    <div className="h-[5vh] min-h-[50px] bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6">
      {/* Left: File Info */}
      <div className="flex items-center gap-4 text-slate-200">
        <Info className="w-4 h-4 text-blue-400" />
        <span className="text-sm">
          <span className="text-slate-400">File:</span>{' '}
          <span className="font-medium">{fileInfo.fileName}</span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-sm">
          <span className="text-slate-400">Duration:</span>{' '}
          <span className="font-medium">{fileInfo.duration}</span>
        </span>
      </div>

      {/* Center: Frame Counter */}
      <div className="text-center">
        <div className="text-lg font-mono text-white">
          {currentFrame} <span className="text-slate-500">/</span> {fileInfo.totalFrames}
        </div>
        <div className="text-xs text-slate-400">frame</div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onShowShortcuts}
                className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-200"
              >
                <Keyboard className="w-4 h-4 mr-2" />
                快捷键
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>查看快捷键列表</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          variant="outline"
          size="sm"
          onClick={onPrevFile}
          className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-200"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onNextFile}
          className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-200"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          onClick={onSubmit}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Send className="w-4 h-4 mr-2" />
          提交
        </Button>
      </div>
    </div>
  );
}