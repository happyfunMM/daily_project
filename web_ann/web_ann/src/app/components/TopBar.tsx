import { Info, Keyboard, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { Button } from './ui/button';
import { FileInfo } from '../types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

import { QualityResult } from '../types';

interface TopBarProps {
  fileInfo: FileInfo;
  currentFrame: number;
  onPrevFile: () => void;
  onNextFile: () => void;
  onSubmit: () => void;
  onShowShortcuts: () => void;
  onSkipAnnotation: () => void;
  qualityResult?: QualityResult;
  isQualityMode?: boolean;
  onToggleQualityMode: () => void;
}

export function TopBar({ fileInfo, currentFrame, onPrevFile, onNextFile, onSubmit, onShowShortcuts, onSkipAnnotation, qualityResult, isQualityMode, onToggleQualityMode }: TopBarProps) {
  return (
    <div className="h-[5vh] min-h-[50px] bg-card border-b border-border flex items-center justify-between px-6">
      {/* Left: File Info */}
      <div className="flex items-center gap-4 text-foreground">
        <Info className="w-4 h-4 text-blue-400" />
        <span className="text-sm">
          <span className="text-muted-foreground">File:</span>{' '}
          <span className="font-medium">{fileInfo.fileName}</span>
        </span>
        <span className="text-muted-foreground">|</span>
        <span className="text-sm">
          <span className="text-muted-foreground">Duration:</span>{' '}
          <span className="font-medium">{fileInfo.duration}</span>
        </span>
        {isQualityMode && qualityResult && (
          <>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm">
              <span className="text-muted-foreground">质检:</span>{' '}
              <span className="font-medium text-green-500">{qualityResult.passedSlices}</span>/
              <span className="font-medium text-red-500">{qualityResult.failedSlices}</span>/
              <span className="font-medium text-yellow-500">{qualityResult.pendingSlices}</span>
            </span>
          </>
        )}
      </div>

      {/* Center: Frame Counter */}
      <div className="text-center">
        <div className="text-lg font-mono text-foreground">
          {currentFrame} <span className="text-muted-foreground">/</span> {fileInfo.totalFrames}
        </div>
        <div className="text-xs text-muted-foreground">frame</div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleQualityMode}
          className={`bg-muted border-border hover:bg-accent text-foreground ${isQualityMode ? 'bg-blue-100 border-blue-300' : ''}`}
        >
          {isQualityMode ? '质检模式' : '标注模式'}
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onShowShortcuts}
                className="bg-muted border-border hover:bg-accent text-foreground"
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
          className="bg-muted border-border hover:bg-accent text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onNextFile}
          className="bg-muted border-border hover:bg-accent text-foreground"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onSkipAnnotation}
          className="bg-muted border-border hover:bg-accent text-foreground"
        >
          跳过标注
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