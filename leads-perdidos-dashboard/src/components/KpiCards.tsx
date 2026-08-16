import type { GeneralKpis } from '@/lib/aggregations';

export function KpiCards({ kpis }: { kpis: GeneralKpis }) {
  const cards = [
    { label: 'Leads perdidos no período', value: kpis.totalPerdidos },
    { label: 'Vendedores', value: kpis.numVendedores },
    { label: 'Motivo mais comum', value: kpis.motivoMaisComum },
    { label: 'Etapa anterior mais comum', value: kpis.etapaMaisComum },
    { label: 'Canal mais comum', value: kpis.canalMaisComum },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
          <p className="mt-1 truncate text-xl font-semibold text-slate-900" title={String(card.value)}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
