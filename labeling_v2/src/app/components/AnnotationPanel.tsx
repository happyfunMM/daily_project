import { useState, useEffect } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Slice } from '../types';

interface AnnotationPanelProps {
  slice: Slice | null;
  isNewSlice: boolean;
  onSave: (slice: Slice) => void;
  onCancel: () => void;
  allSlices: Slice[];
}

const LEVEL1_OPTIONS = [
  '站立',
  '行走',
  '跑步',
  '跳跃',
  '弯腰',
  '蹲下',
  '拾取',
  '放置',
  '转身',
  '挥手',
];

const LEVEL2_OPTIONS: Record<string, string[]> = {
  '站立': ['直立站立', '放松站立', '警觉站立'],
  '行走': ['正常行走', '快速行走', '慢速行走', '倒退行走'],
  '跑步': ['慢跑', '快跑', '冲刺'],
  '跳跃': ['原地跳', '向前跳', '向上跳'],
  '弯腰': ['90度弯腰', '轻微弯腰', '深度弯腰'],
  '蹲下': ['全蹲', '半蹲', '单腿蹲'],
  '拾取': ['拾取地面物品', '拾取腰部物品', '拾取头部物品'],
  '放置': ['放置到地面', '放置到台面', '放置到高处'],
  '转身': ['90度转身', '180度转身', '360度转身'],
  '挥手': ['打招呼', '告别', '指示方向'],
};

export function AnnotationPanel({ slice, isNewSlice, onSave, onCancel, allSlices }: AnnotationPanelProps) {
  const [formData, setFormData] = useState<Slice>(
    slice || {
      id: `slice-${Date.now()}`,
      start: 0,
      end: 0,
      level1: '',
      level2: '',
    }
  );

  const [customLevel1, setCustomLevel1] = useState('');
  const [customLevel2, setCustomLevel2] = useState('');
  const [useCustomLevel1, setUseCustomLevel1] = useState(false);
  const [useCustomLevel2, setUseCustomLevel2] = useState(false);

  useEffect(() => {
    if (slice) {
      setFormData(slice);
      setUseCustomLevel1(!LEVEL1_OPTIONS.includes(slice.level1));
      setUseCustomLevel2(
        slice.level1 && !LEVEL2_OPTIONS[slice.level1]?.includes(slice.level2)
      );
    }
  }, [slice]);

  const handleSave = () => {
    const finalData = {
      ...formData,
      level1: useCustomLevel1 ? customLevel1 : formData.level1,
      level2: useCustomLevel2 ? customLevel2 : formData.level2,
    };

    if (!finalData.level1 || !finalData.level2) {
      alert('请填写完整的标注信息');
      return;
    }

    onSave(finalData);
  };

  const level2Options = formData.level1 ? LEVEL2_OPTIONS[formData.level1] || [] : [];

  if (!slice && !isNewSlice) {
    return (
      <div className="w-80 bg-slate-900 border-l border-slate-700 flex flex-col">
        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-slate-300 mb-2">未选择切片</h3>
          <p className="text-sm text-slate-500">
            在时间轴上按住 Shift 并拖拽创建新切片，或点击现有切片进行编辑
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-700 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-slate-200">
          {isNewSlice ? '新建切片' : '编辑切片'}
        </h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Form */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Time Range */}
          <div className="space-y-2">
            <Label className="text-slate-300">时间范围</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-slate-400">开始帧</Label>
                <Input
                  type="number"
                  value={formData.start}
                  onChange={(e) =>
                    setFormData({ ...formData, start: parseInt(e.target.value) || 0 })
                  }
                  className="bg-slate-800 border-slate-600 text-slate-200"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">结束帧</Label>
                <Input
                  type="number"
                  value={formData.end}
                  onChange={(e) =>
                    setFormData({ ...formData, end: parseInt(e.target.value) || 0 })
                  }
                  className="bg-slate-800 border-slate-600 text-slate-200"
                />
              </div>
            </div>
            <div className="text-xs text-slate-500">
              时长: {Math.floor((formData.end - formData.start) / 30 * 100) / 100} 秒
            </div>
          </div>

          {/* Level 1 */}
          <div className="space-y-2">
            <Label className="text-slate-300">一级动作分类</Label>
            {!useCustomLevel1 ? (
              <>
                <Select
                  value={formData.level1}
                  onValueChange={(value) =>
                    setFormData({ ...formData, level1: value, level2: '' })
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-200">
                    <SelectValue placeholder="选择动作类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVEL1_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="link"
                  onClick={() => setUseCustomLevel1(true)}
                  className="text-xs text-blue-400 p-0 h-auto"
                >
                  手动输入
                </Button>
              </>
            ) : (
              <>
                <Input
                  value={customLevel1}
                  onChange={(e) => setCustomLevel1(e.target.value)}
                  placeholder="输入自定义动作类型"
                  className="bg-slate-800 border-slate-600 text-slate-200"
                />
                <Button
                  size="sm"
                  variant="link"
                  onClick={() => {
                    setUseCustomLevel1(false);
                    setCustomLevel1('');
                  }}
                  className="text-xs text-blue-400 p-0 h-auto"
                >
                  选择预设
                </Button>
              </>
            )}
          </div>

          {/* Level 2 */}
          <div className="space-y-2">
            <Label className="text-slate-300">二级动作分类</Label>
            {!useCustomLevel2 ? (
              <>
                <Select
                  value={formData.level2}
                  onValueChange={(value) => setFormData({ ...formData, level2: value })}
                  disabled={!formData.level1 || level2Options.length === 0}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-200">
                    <SelectValue placeholder="选择具体动作" />
                  </SelectTrigger>
                  <SelectContent>
                    {level2Options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="link"
                  onClick={() => setUseCustomLevel2(true)}
                  className="text-xs text-blue-400 p-0 h-auto"
                >
                  手动输入
                </Button>
              </>
            ) : (
              <>
                <Input
                  value={customLevel2}
                  onChange={(e) => setCustomLevel2(e.target.value)}
                  placeholder="输入自定义具体动作"
                  className="bg-slate-800 border-slate-600 text-slate-200"
                />
                <Button
                  size="sm"
                  variant="link"
                  onClick={() => {
                    setUseCustomLevel2(false);
                    setCustomLevel2('');
                  }}
                  className="text-xs text-blue-400 p-0 h-auto"
                >
                  选择预设
                </Button>
              </>
            )}
          </div>

          {/* Existing Slices List */}
          {allSlices.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-slate-700">
              <Label className="text-slate-300">已标注切片 ({allSlices.length})</Label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {allSlices.map((s) => (
                  <div
                    key={s.id}
                    className="p-2 bg-slate-800 rounded text-xs text-slate-300 border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{s.level1}</span>
                      <span className="text-slate-500">
                        {s.start} - {s.end}
                      </span>
                    </div>
                    <div className="text-slate-400">{s.level2}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="p-4 border-t border-slate-700 flex gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 bg-slate-800 border-slate-600"
        >
          取消 (Esc)
        </Button>
        <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          保存 (Enter)
        </Button>
      </div>
    </div>
  );
}
