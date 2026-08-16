import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { fetchLostDeals, fetchTaskAssociationsForDeals, fetchTasksByIds } from '@/lib/hubspot';
import { DEAL_PROPERTY_MAP, VENDOR_SEED_MAP } from '@/config/hubspot';
import { computeDealDelay, type TaskForDelay } from '@/lib/delay';

export interface SyncResult {
  dealsSynced: number;
  vendorsSeeded: number;
  windowFrom: string;
  windowTo: string;
}

function toIsoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  // HubSpot retorna datas de deal como timestamp em ms (string) e datas de
  // task como ISO datetime — normalizamos ambas para yyyy-MM-dd.
  const numeric = Number(value);
  const date = Number.isFinite(numeric) && String(numeric) === value ? new Date(numeric) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

/**
 * Executa a sincronização completa: busca deals perdidos do HubSpot no
 * período informado, suas tasks associadas, calcula o indicador de atraso e
 * faz upsert de tudo no Supabase. Registra o resultado em `sync_log`.
 */
export async function runSync(from: string, to: string): Promise<SyncResult> {
  const supabase = createAdminSupabaseClient();

  const { data: logRow, error: logError } = await supabase
    .from('sync_log')
    .insert({ status: 'running' })
    .select()
    .single();

  if (logError) throw new Error(`Falha ao criar sync_log: ${logError.message}`);

  try {
    const deals = await fetchLostDeals(from, to);
    const dealIds = deals.map((d) => d.id);

    const associations = await fetchTaskAssociationsForDeals(dealIds);
    const allTaskIds = Array.from(new Set(Array.from(associations.values()).flat()));
    const taskDetails = await fetchTasksByIds(allTaskIds);

    // 1) Garante que todos os vendedores referenciados existam na tabela vendors.
    const ownerIds = Array.from(
      new Set(deals.map((d) => d.properties.hubspot_owner_id).filter((id): id is string => !!id)),
    );

    let vendorsSeeded = 0;
    if (ownerIds.length > 0) {
      const { data: existingVendors } = await supabase.from('vendors').select('id').in('id', ownerIds);
      const existingIds = new Set((existingVendors ?? []).map((v) => v.id));
      const newVendors = ownerIds
        .filter((id) => !existingIds.has(id))
        .map((id) => ({ id, name: VENDOR_SEED_MAP[id] ?? `Vendedor ${id}`, active: true }));

      if (newVendors.length > 0) {
        const { error: vendorError } = await supabase.from('vendors').insert(newVendors);
        if (vendorError) throw new Error(`Falha ao inserir vendedores novos: ${vendorError.message}`);
        vendorsSeeded = newVendors.length;
      }
    }

    // 2) Monta as linhas de deals + calcula atraso.
    const dealRows = deals.map((deal) => {
      const closedate = toIsoDate(deal.properties.closedate);
      const taskIds = associations.get(deal.id) ?? [];
      const tasksForDelay: TaskForDelay[] = taskIds.map((taskId) => {
        const props = taskDetails.get(taskId) ?? {};
        return {
          due_date: toIsoDate(props.hs_timestamp),
          completion_date: toIsoDate(props.hs_task_completion_date),
          status: props.hs_task_status ?? null,
        };
      });

      const { atraso, maiorAtrasoDias } = computeDealDelay(tasksForDelay, closedate);

      return {
        id: Number(deal.id),
        vendor_id: deal.properties.hubspot_owner_id || null,
        dealname: deal.properties.dealname || null,
        etapa_anterior: deal.properties[DEAL_PROPERTY_MAP.etapaAnterior] || null,
        motivo: deal.properties[DEAL_PROPERTY_MAP.motivoPerda] || null,
        canal: deal.properties[DEAL_PROPERTY_MAP.canalAquisicao] || null,
        icp: deal.properties[DEAL_PROPERTY_MAP.icp] || 'Não encontrado',
        closedate,
        createdate: toIsoDate(deal.properties.createdate),
        atraso,
        num_tarefas: taskIds.length,
        maior_atraso_dias: maiorAtrasoDias,
        synced_at: new Date(0).toISOString(), // sobrescrito pelo default do banco via trigger não existe; setamos abaixo
      };
    });

    // synced_at deve refletir o momento real da sincronização.
    const now = new Date().toISOString();
    for (const row of dealRows) row.synced_at = now;

    if (dealRows.length > 0) {
      const { error: dealsError } = await supabase.from('deals').upsert(dealRows, { onConflict: 'id' });
      if (dealsError) throw new Error(`Falha ao fazer upsert de deals: ${dealsError.message}`);
    }

    // 3) Monta e faz upsert das tasks.
    const taskRows = Array.from(associations.entries()).flatMap(([dealId, taskIds]) =>
      taskIds.map((taskId) => {
        const props = taskDetails.get(taskId) ?? {};
        return {
          id: Number(taskId),
          deal_id: Number(dealId),
          due_date: toIsoDate(props.hs_timestamp),
          completion_date: toIsoDate(props.hs_task_completion_date),
          status: props.hs_task_status ?? null,
        };
      }),
    );

    if (taskRows.length > 0) {
      const { error: tasksError } = await supabase.from('tasks').upsert(taskRows, { onConflict: 'id' });
      if (tasksError) throw new Error(`Falha ao fazer upsert de tasks: ${tasksError.message}`);
    }

    await supabase
      .from('sync_log')
      .update({ finished_at: new Date().toISOString(), status: 'success', deals_synced: dealRows.length })
      .eq('id', logRow.id);

    return { dealsSynced: dealRows.length, vendorsSeeded, windowFrom: from, windowTo: to };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await supabase
      .from('sync_log')
      .update({ finished_at: new Date().toISOString(), status: 'error', error_message: message })
      .eq('id', logRow.id);
    throw error;
  }
}
