'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { DealsWithVendorName } from '@/lib/aggregations';
import type { VendorSummary } from '@/types';
import { VendorPanel } from './VendorPanel';
import { DelayTab } from './DelayTab';

export function DashboardTabs({
  summaries,
  dealsByVendor,
}: {
  summaries: VendorSummary[];
  dealsByVendor: Record<string, DealsWithVendorName[]>;
}) {
  const tabs = [...summaries.map((s) => s.vendor.id), '__atraso__'];
  const [active, setActive] = useState(tabs[0] ?? '__atraso__');

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {summaries.map((s) => (
          <button
            key={s.vendor.id}
            onClick={() => setActive(s.vendor.id)}
            className={clsx(
              'rounded-t-lg px-4 py-2 text-sm font-medium transition',
              active === s.vendor.id
                ? 'border-b-2 border-brand-500 text-brand-600'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {s.vendor.name} <span className="text-xs text-slate-400">({s.total})</span>
          </button>
        ))}
        <button
          onClick={() => setActive('__atraso__')}
          className={clsx(
            'rounded-t-lg px-4 py-2 text-sm font-medium transition',
            active === '__atraso__'
              ? 'border-b-2 border-brand-500 text-brand-600'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          ⏱️ Atraso de Tarefa
        </button>
      </div>

      <div className="pt-4">
        {active === '__atraso__' ? (
          <DelayTab summaries={summaries} />
        ) : (
          <VendorPanel deals={dealsByVendor[active] ?? []} />
        )}
        {summaries.length === 0 && active !== '__atraso__' && (
          <p className="text-sm text-slate-400">Nenhum lead perdido no período selecionado.</p>
        )}
      </div>
    </div>
  );
}
