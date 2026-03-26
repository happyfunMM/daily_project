import { ScrollArea } from './ui/scroll-area';

const MOCK_SCRIPT = `任务描述：行走与拾取物品

步骤 1: 从起始位置开始站立
- 保持直立姿势
- 双手自然下垂
- 目视前方

步骤 2: 向前行走 5 米
- 保持稳定的步伐
- 手臂自然摆动
- 速度约 1.2 m/s

步骤 3: 到达目标位置停止
- 减速并停止
- 保持平衡

步骤 4: 弯腰拾取地面物品
- 膝盖微曲
- 伸手触碰物品
- 抓取物品

步骤 5: 站立并持有物品
- 恢复直立姿势
- 将物品举至胸前
- 保持稳定

步骤 6: 转身返回起点
- 180度转身
- 保持物品稳定

步骤 7: 向起点行走
- 持物行走
- 保持平衡
- 稳定速度

步骤 8: 到达起点放下物品
- 弯腰放置物品
- 恢复站立姿势
- 任务完成
`;

export function ScriptViewer() {
  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden">
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2">
        <h3 className="text-sm text-slate-200">原始脚本文件</h3>
      </div>
      <ScrollArea className="h-[calc(100%-40px)] p-4">
        <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
          {MOCK_SCRIPT}
        </pre>
      </ScrollArea>
    </div>
  );
}
