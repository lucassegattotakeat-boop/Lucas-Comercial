'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { DateRange } from '@/types';

export function DateRangePicker({ defaultRange }: { defaultRange: DateRange }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(searchParams.get('from') ?? defaultRange.from);
  const [to, setTo] = useState(searchParams.get('to') ?? defaultRange.to);

  function applyRange() {
    const params = new URLSearchParams(searchParams.toString());
    params.set('from', from);
    params.set('to', to);
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-brand-500"
      />
      <span className="text-slate-400">até</span>
      <input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-brand-500"
      />
      <button
        onClick={applyRange}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Aplicar
      </button>
    </div>
  );
}
