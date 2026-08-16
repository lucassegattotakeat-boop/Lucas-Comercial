import type { BreakdownItem } from '@/types';

export function BreakdownBars({ title, items }: { title: string; items: BreakdownItem[] }) {
  const top = items.slice(0, 6);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <div className="mt-3 space-y-2">
        {top.length === 0 && <p className="text-sm text-slate-400">Sem dados no período.</p>}
        {top.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
              <span className="truncate pr-2">{item.label}</span>
              <span className="shrink-0 tabular-nums text-slate-500">
                {item.count} · {item.percent}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-brand-500"
                style={{ width: `${Math.max(item.percent, 2)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
