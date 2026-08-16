import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentMonthRange, isValidIsoDate } from '@/lib/date-range';
import { getDealsInRange, getVendors } from '@/lib/queries';
import { buildGeneralKpis, buildVendorSummaries } from '@/lib/aggregations';
import { KpiCards } from '@/components/KpiCards';
import { DateRangePicker } from '@/components/DateRangePicker';
import { SyncButton } from '@/components/SyncButton';
import { DashboardTabs } from '@/components/DashboardTabs';

export const dynamic = 'force-dynamic';

interface DashboardPageProps {
  searchParams: { from?: string; to?: string };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const defaultRange = getCurrentMonthRange();
  const range = {
    from: isValidIsoDate(searchParams.from) ? searchParams.from : defaultRange.from,
    to: isValidIsoDate(searchParams.to) ? searchParams.to : defaultRange.to,
  };

  const supabase = createServerSupabaseClient();
  const [deals, vendors, lastSync] = await Promise.all([
    getDealsInRange(range),
    getVendors(),
    supabase
      .from('sync_log')
      .select('finished_at, status')
      .eq('status', 'success')
      .order('finished_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const kpis = buildGeneralKpis(deals);
  const summaries = buildVendorSummaries(deals, vendors);

  const dealsByVendor: Record<string, typeof deals> = {};
  for (const summary of summaries) {
    dealsByVendor[summary.vendor.id] = deals.filter((d) => (d.vendor_id ?? 'sem-vendedor') === summary.vendor.id);
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Leads Perdidos — Inside Sales</h1>
          <p className="text-sm text-slate-500">
            Período: {range.from} até {range.to}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker defaultRange={defaultRange} />
          <SyncButton lastSyncedAt={lastSync.data?.finished_at ?? null} />
        </div>
      </header>

      <KpiCards kpis={kpis} />

      <DashboardTabs summaries={summaries} dealsByVendor={dealsByVendor} />
    </main>
  );
}
