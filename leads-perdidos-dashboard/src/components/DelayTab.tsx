import clsx from 'clsx';
import type { VendorSummary } from '@/types';

function faixaColor(percent: number) {
  if (percent < 30) return 'bg-emerald-500';
  if (percent < 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export function DelayTab({ summaries }: { summaries: VendorSummary[] }) {
  const totalLeads = summaries.reduce((acc, s) => acc + s.total, 0);
  const totalComAtraso = summaries.reduce((acc, s) => acc + s.comAtraso, 0);
  const totalSemTarefa = summaries.reduce((acc, s) => acc + s.semTarefa, 0);
  const percentGeral = totalLeads > 0 ? Math.round((totalComAtraso / totalLeads) * 1000) / 10 : 0;

  const ranked = [...summaries].sort((a, b) => b.percentAtraso - a.percentAtraso);
  const maior = ranked[0];
  const menor = ranked[ranked.length - 1];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="% geral com atraso" value={`${percentGeral}%`} />
        <Kpi label="Leads sem tarefa" value={String(totalSemTarefa)} />
        <Kpi label="Maior % de atraso" value={maior ? `${maior.vendor.name} (${maior.percentAtraso}%)` : '—'} />
        <Kpi label="Menor % de atraso" value={menor ? `${menor.vendor.name} (${menor.percentAtraso}%)` : '—'} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-800">Ranking por vendedor — % de atraso</p>
        <div className="mt-3 space-y-2">
          {ranked.map((s) => (
            <div key={s.vendor.id}>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                <span>{s.vendor.name}</span>
                <span className="tabular-nums text-slate-500">{s.percentAtraso}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div
                  className={clsx('h-2 rounded-full', faixaColor(s.percentAtraso))}
                  style={{ width: `${Math.max(s.percentAtraso, 2)}%` }}
                />
              </div>
            </div>
          ))}
          {ranked.length === 0 && <p className="text-sm text-slate-400">Sem dados no período.</p>}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">Vendedor</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Com atraso</th>
              <th className="px-3 py-2">%</th>
              <th className="px-3 py-2">Sem tarefa</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.vendor.id} className="border-b border-slate-50 last:border-0">
                <td className="px-3 py-2 font-medium text-slate-800">{s.vendor.name}</td>
                <td className="px-3 py-2 text-slate-600">{s.total}</td>
                <td className="px-3 py-2 text-slate-600">{s.comAtraso}</td>
                <td className="px-3 py-2 text-slate-600">{s.percentAtraso}%</td>
                <td className="px-3 py-2 text-slate-600">{s.semTarefa}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-semibold text-slate-800">
              <td className="px-3 py-2">TOTAL</td>
              <td className="px-3 py-2">{totalLeads}</td>
              <td className="px-3 py-2">{totalComAtraso}</td>
              <td className="px-3 py-2">{percentGeral}%</td>
              <td className="px-3 py-2">{totalSemTarefa}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-slate-900" title={value}>
        {value}
      </p>
    </div>
  );
}
