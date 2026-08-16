'use client';

import { useMemo, useState } from 'react';
import type { DealsWithVendorName } from '@/lib/aggregations';
import { Pill } from './Pill';

type SortKey = 'dealname' | 'etapa_anterior' | 'motivo' | 'canal' | 'icp' | 'closedate';

const FILTER_FIELDS = [
  { key: 'etapa_anterior', label: 'Etapa' },
  { key: 'motivo', label: 'Motivo' },
  { key: 'canal', label: 'Canal' },
  { key: 'icp', label: 'ICP' },
] as const;

function uniqueValues(deals: DealsWithVendorName[], field: keyof DealsWithVendorName) {
  return Array.from(new Set(deals.map((d) => (d[field] as string) || 'Não informado'))).sort();
}

export function DealsTable({ deals }: { deals: DealsWithVendorName[] }) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [atrasoFilter, setAtrasoFilter] = useState<'todos' | 'sim' | 'nao'>('todos');
  const [sortKey, setSortKey] = useState<SortKey>('closedate');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let result = deals;

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter((d) => (d.dealname ?? '').toLowerCase().includes(term));
    }

    for (const field of FILTER_FIELDS) {
      const value = filters[field.key];
      if (value) {
        result = result.filter((d) => ((d[field.key] as string) || 'Não informado') === value);
      }
    }

    if (atrasoFilter !== 'todos') {
      result = result.filter((d) => d.atraso === (atrasoFilter === 'sim'));
    }

    const sorted = [...result].sort((a, b) => {
      const aVal = (a[sortKey] as string) ?? '';
      const bVal = (b[sortKey] as string) ?? '';
      return aVal.localeCompare(bVal);
    });

    return sortAsc ? sorted : sorted.reverse();
  }, [deals, search, filters, atrasoFilter, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por negócio…"
          className="w-56 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
        />
        {FILTER_FIELDS.map((field) => (
          <select
            key={field.key}
            value={filters[field.key] ?? ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, [field.key]: e.target.value }))}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-600 outline-none focus:border-brand-500"
          >
            <option value="">{field.label}: todos</option>
            {uniqueValues(deals, field.key).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        ))}
        <select
          value={atrasoFilter}
          onChange={(e) => setAtrasoFilter(e.target.value as typeof atrasoFilter)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-600 outline-none focus:border-brand-500"
        >
          <option value="todos">Atraso: todos</option>
          <option value="sim">Com atraso</option>
          <option value="nao">Sem atraso</option>
        </select>
        <span className="ml-auto text-xs text-slate-400">{filtered.length} de {deals.length} leads</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
              {(
                [
                  ['dealname', 'Negócio'],
                  ['etapa_anterior', 'Etapa Anterior'],
                  ['motivo', 'Motivo'],
                  ['canal', 'Canal'],
                  ['icp', 'ICP'],
                ] as [SortKey, string][]
              ).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="cursor-pointer select-none px-3 py-2 hover:text-slate-700"
                >
                  {label} {sortKey === key ? (sortAsc ? '↑' : '↓') : ''}
                </th>
              ))}
              <th className="px-3 py-2">Atraso</th>
              <th
                onClick={() => toggleSort('closedate')}
                className="cursor-pointer select-none px-3 py-2 hover:text-slate-700"
              >
                Data Perdido {sortKey === 'closedate' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((deal) => (
              <tr key={deal.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-800">{deal.dealname ?? '—'}</td>
                <td className="px-3 py-2 text-slate-600">{deal.etapa_anterior ?? '—'}</td>
                <td className="px-3 py-2 text-slate-600">{deal.motivo ?? '—'}</td>
                <td className="px-3 py-2 text-slate-600">{deal.canal ?? '—'}</td>
                <td className="px-3 py-2 text-slate-600">{deal.icp ?? 'Não encontrado'}</td>
                <td className="px-3 py-2">
                  <Pill tone={deal.atraso ? 'red' : 'green'}>{deal.atraso ? 'Sim' : 'Não'}</Pill>
                </td>
                <td className="px-3 py-2 text-slate-600">{deal.closedate ?? '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                  Nenhum lead encontrado com os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
