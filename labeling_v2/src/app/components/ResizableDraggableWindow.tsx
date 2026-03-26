import { ReactNode, useState, useRef, useEffect } from 'react';
import { Resizable } from 're-resizable';
import { GripVertical, Maximize2, Minimize2, Minus, FileText } from 'lucide-react';

interface ResizableDraggableWindowProps {
  title: string;
  children: ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  defaultX?: number;
  defaultY?: number;
  onMinimize?: (isMinimized: boolean) => void;
}

export function ResizableDraggableWindow({
  title,
  children,
  defaultWidth = 400,
  defaultHeight = 300,
  minWidth = 200,
  minHeight = 150,
  defaultX = 100,
  defaultY = 100,
  onMinimize,
}: ResizableDraggableWindowProps) {
  const [position, setPosition] = useState({ x: defaultX, y: defaultY });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.window-header')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isMaximized) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, isMaximized]);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const toggleMinimize = () => {
    const newMinimizedState = !isMinimized;
    setIsMinimized(newMinimizedState);
    if (onMinimize) {
      onMinimize(newMinimizedState);
    }
  };

  // Minimized icon button
  if (isMinimized) {
    return null; // The icon will be rendered by the parent component
  }

  if (isMaximized) {
    return (
      <div
        ref={windowRef}
        className="fixed inset-0 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl flex flex-col z-50"
      >
        <div
          className="window-header bg-slate-900 border-b border-slate-700 px-3 py-2 flex items-center justify-between cursor-move select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-200">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMinimize}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
            >
              <Minus className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={toggleMaximize}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
            >
              <Minimize2 className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    );
  }

  return (
    <Resizable
      defaultSize={{ width: defaultWidth, height: defaultHeight }}
      minWidth={minWidth}
      minHeight={minHeight}
      className="absolute bg-slate-800 border border-slate-600 rounded-lg shadow-2xl flex flex-col"
      style={{
        left: position.x,
        top: position.y,
        zIndex: 10,
      }}
      enable={{
        top: false,
        right: true,
        bottom: true,
        left: false,
        topRight: false,
        bottomRight: true,
        bottomLeft: false,
        topLeft: false,
      }}
    >
      <div
        className="window-header bg-slate-900 border-b border-slate-700 px-3 py-2 flex items-center justify-between cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-200">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMinimize}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <Minus className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={toggleMaximize}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <Maximize2 className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </Resizable>
  );
}

interface MinimizedIconProps {
  title: string;
  onClick: () => void;
}

export function MinimizedIcon({ title, onClick }: MinimizedIconProps) {
  return (
    <button
      onClick={onClick}
      className="bg-slate-800/90 backdrop-blur-sm border border-slate-600 rounded-lg px-3 py-2 hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-lg"
    >
      <FileText className="w-4 h-4 text-blue-400" />
      <span className="text-xs text-slate-200">{title}</span>
    </button>
  );
}