import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { DateRange, Vendor } from '@/types';
import type { DealsWithVendorName } from '@/lib/aggregations';

/** Busca todos os deals perdidos dentro do período, com o nome do vendedor já resolvido. */
export async function getDealsInRange(range: DateRange): Promise<DealsWithVendorName[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('deals')
    .select('*, vendors(name)')
    .gte('closedate', range.from)
    .lte('closedate', range.to)
    .order('closedate', { ascending: false });

  if (error) throw new Error(`Falha ao buscar deals: ${error.message}`);

  return (data ?? []).map((row: any) => ({
    ...row,
    vendorName: row.vendors?.name ?? 'Sem vendedor',
  }));
}

export async function getVendors(): Promise<Vendor[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from('vendors').select('*').eq('active', true).order('name');
  if (error) throw new Error(`Falha ao buscar vendedores: ${error.message}`);
  return data ?? [];
}
