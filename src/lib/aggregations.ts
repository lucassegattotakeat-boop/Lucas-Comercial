import type { BreakdownItem, Deal, Vendor, VendorSummary } from '@/types';

export interface DealsWithVendorName extends Deal {
  vendorName: string;
}

export function buildBreakdown(deals: DealsWithVendorName[], field: keyof Deal): BreakdownItem[] {
  const counts = new Map<string, number>();
  for (const deal of deals) {
    const rawValue = deal[field];
    const label = (rawValue as string) || 'Não informado';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const total = deals.length || 1;
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count, percent: Math.round((count / total) * 1000) / 10 }))
    .sort((a, b) => b.count - a.count);
}

export function groupByVendor(deals: DealsWithVendorName[]): Map<string, DealsWithVendorName[]> {
  const map = new Map<string, DealsWithVendorName[]>();
  for (const deal of deals) {
    const key = deal.vendor_id ?? 'sem-vendedor';
    const list = map.get(key) ?? [];
    list.push(deal);
    map.set(key, list);
  }
  return map;
}

export function buildVendorSummaries(deals: DealsWithVendorName[], vendors: Vendor[]): VendorSummary[] {
  const grouped = groupByVendor(deals);
  const summaries: VendorSummary[] = [];

  for (const [vendorId, vendorDeals] of grouped.entries()) {
    const vendor = vendors.find((v) => v.id === vendorId) ?? {
      id: vendorId,
      name: vendorDeals[0]?.vendorName ?? 'Sem vendedor',
      active: true,
    };
    const total = vendorDeals.length;
    const comAtraso = vendorDeals.filter((d) => d.atraso).length;
    const semTarefa = vendorDeals.filter((d) => d.num_tarefas === 0).length;
    summaries.push({
      vendor,
      total,
      comAtraso,
      semTarefa,
      percentAtraso: total > 0 ? Math.round((comAtraso / total) * 1000) / 10 : 0,
    });
  }

  return summaries.sort((a, b) => b.total - a.total);
}

export interface GeneralKpis {
  totalPerdidos: number;
  numVendedores: number;
  motivoMaisComum: string;
  etapaMaisComum: string;
  canalMaisComum: string;
}

export function buildGeneralKpis(deals: DealsWithVendorName[]): GeneralKpis {
  const motivos = buildBreakdown(deals, 'motivo');
  const etapas = buildBreakdown(deals, 'etapa_anterior');
  const canais = buildBreakdown(deals, 'canal');
  const vendorIds = new Set(deals.map((d) => d.vendor_id).filter(Boolean));

  return {
    totalPerdidos: deals.length,
    numVendedores: vendorIds.size,
    motivoMaisComum: motivos[0]?.label ?? '—',
    etapaMaisComum: etapas[0]?.label ?? '—',
    canalMaisComum: canais[0]?.label ?? '—',
  };
}
