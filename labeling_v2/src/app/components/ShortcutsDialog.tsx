import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { key: 'Space', description: '播放/暂停' },
  { key: '←/→', description: '前进/后退一帧' },
  { key: 'Shift + 拖拽', description: '在时间轴创建新切片' },
  { key: 'Enter', description: '保存当前标注' },
  { key: 'Esc', description: '取消标注' },
  { key: '[/]', description: '跳转到上一个/下一个切片' },
  { key: '1/2/4', description: '切换播放速度 (1x/2x/4x)' },
  { key: 'Delete', description: '删除选中的切片' },
];

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-md">
        <DialogHeader>
          <DialogTitle>快捷键列表</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0"
            >
              <span className="text-slate-400">{shortcut.description}</span>
              <kbd className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
