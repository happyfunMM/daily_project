import { Info, Keyboard, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { FileInfo, QualityStatus } from '../types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { useState } from 'react';

import { QualityResult } from '../types';

interface TopBarProps {
  fileInfo: FileInfo;
  currentFrame: number;
  onPrevFile: () => void;
  onNextFile: () => void;
  onSubmit: () => void;
  onShowShortcuts: () => void;
  onSkipAnnotation: (reason: string) => void;
  qualityResult?: QualityResult;
  isQualityMode?: boolean;
  onToggleQualityMode: () => void;
  currentQualityStatus?: QualityStatus | null;
}

export function TopBar({ fileInfo, currentFrame, onPrevFile, onNextFile, onSubmit, onShowShortcuts, onSkipAnnotation, qualityResult, isQualityMode, onToggleQualityMode, currentQualityStatus }: TopBarProps) {
  const [showSkipInput, setShowSkipInput] = useState(false);
  const [skipReason, setSkipReason] = useState('');

  const getStatusText = (status: QualityStatus | null) => {
    switch (status) {
      case 'passed':
        return '通过';
      case 'failed_rescan':
        return '不通过：重标';
      case 'failed_discard':
        return '不通过：丢弃';
      default:
        return '待质检';
    }
  };

  const getStatusColor = (status: QualityStatus | null) => {
    switch (status) {
      case 'passed':
        return 'text-green-500';
      case 'failed_rescan':
        return 'text-red-500';
      case 'failed_discard':
        return 'text-gray-500';
      default:
        return 'text-yellow-500';
    }
  };

  const handleSkipClick = () => {
    if (showSkipInput && skipReason.trim()) {
      onSkipAnnotation(skipReason.trim());
      setSkipReason('');
      setShowSkipInput(false);
    } else {
      setShowSkipInput(true);
    }
  };

  const handleSkipCancel = () => {
    setShowSkipInput(false);
    setSkipReason('');
  };

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
        {isQualityMode && (
          <>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm">
              <span className="text-muted-foreground">质检状态:</span>{' '}
              <span className={`font-medium ${getStatusColor(currentQualityStatus)}`}>
                {getStatusText(currentQualityStatus)}
              </span>
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
        {!isQualityMode && (
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkipClick}
              className="bg-muted border-border hover:bg-accent text-foreground"
            >
              {showSkipInput ? '确认跳过' : '跳过标注'}
            </Button>
            {showSkipInput && (
              <div className="absolute top-full right-0 mt-1 flex items-center gap-1 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-2xl p-2 z-50">
                <Input
                  type="text"
                  placeholder="请输入跳过原因"
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  className="w-40 h-7 text-xs"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipCancel}
                  className="h-7 px-2 text-xs"
                >
                  取消
                </Button>
              </div>
            )}
          </div>
        )}

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