import type { DealsWithVendorName } from '@/lib/aggregations';
import { buildBreakdown } from '@/lib/aggregations';
import { BreakdownBars } from './BreakdownBars';
import { DealsTable } from './DealsTable';

export function VendorPanel({ deals }: { deals: DealsWithVendorName[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BreakdownBars title="Etapa Anterior" items={buildBreakdown(deals, 'etapa_anterior')} />
        <BreakdownBars title="Motivo da Perda" items={buildBreakdown(deals, 'motivo')} />
        <BreakdownBars title="Canal de Aquisição" items={buildBreakdown(deals, 'canal')} />
        <BreakdownBars title="ICP" items={buildBreakdown(deals, 'icp')} />
      </div>
      <DealsTable deals={deals} />
    </div>
  );
}
