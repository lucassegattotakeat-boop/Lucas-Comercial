import { DEAL_PROPERTIES, HUBSPOT_LOST_STAGE_ID, HUBSPOT_PIPELINE_ID, TASK_PROPERTIES } from '@/config/hubspot';

const HUBSPOT_BASE_URL = 'https://api.hubapi.com';
const MAX_RETRIES = 5;
const PAGE_SIZE = 100;

interface HubspotDealResult {
  id: string;
  properties: Record<string, string | null>;
}

interface HubspotSearchResponse {
  results: HubspotDealResult[];
  paging?: { next?: { after: string } };
}

interface HubspotAssociationsResponse {
  results: Array<{ from: { id: string }; to: Array<{ id: string; type?: string }> }>;
}

interface HubspotTaskBatchResponse {
  results: Array<{ id: string; properties: Record<string, string | null> }>;
}

function getToken(): string {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error('HUBSPOT_ACCESS_TOKEN não configurado.');
  return token;
}

/**
 * Faz uma requisição à API do HubSpot com retry/backoff exponencial para
 * lidar com rate limiting (HTTP 429) e erros transitórios (5xx).
 */
async function hubspotFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  let attempt = 0;
  let lastError: unknown;

  while (attempt < MAX_RETRIES) {
    const res = await fetch(`${HUBSPOT_BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      cache: 'no-store',
    });

    if (res.ok) {
      return (await res.json()) as T;
    }

    if (res.status === 429 || res.status >= 500) {
      const retryAfterHeader = res.headers.get('Retry-After');
      const backoffMs = retryAfterHeader
        ? Number(retryAfterHeader) * 1000
        : Math.min(2 ** attempt * 500, 15_000);
      lastError = new Error(`HubSpot ${res.status} em ${path}`);
      attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      continue;
    }

    const body = await res.text();
    throw new Error(`HubSpot ${res.status} em ${path}: ${body}`);
  }

  throw lastError instanceof Error ? lastError : new Error(`Falha ao chamar HubSpot: ${path}`);
}

/**
 * Busca todos os deals do pipeline/etapa configurados, com closedate dentro
 * da janela informada, paginando até o fim.
 */
export async function fetchLostDeals(from: string, to: string): Promise<HubspotDealResult[]> {
  const allResults: HubspotDealResult[] = [];
  let after: string | undefined;

  do {
    const body = {
      filterGroups: [
        {
          filters: [
            { propertyName: 'pipeline', operator: 'EQ', value: HUBSPOT_PIPELINE_ID },
            { propertyName: 'dealstage', operator: 'EQ', value: HUBSPOT_LOST_STAGE_ID },
            { propertyName: 'closedate', operator: 'GTE', value: new Date(`${from}T00:00:00Z`).getTime() },
            { propertyName: 'closedate', operator: 'LTE', value: new Date(`${to}T23:59:59Z`).getTime() },
          ],
        },
      ],
      properties: DEAL_PROPERTIES,
      limit: PAGE_SIZE,
      after,
    };

    const response = await hubspotFetch<HubspotSearchResponse>('/crm/v3/objects/deals/search', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    allResults.push(...response.results);
    after = response.paging?.next?.after;
  } while (after);

  return allResults;
}

/**
 * Busca os IDs de tasks associadas a uma lista de deals, usando a API de
 * associations (não filtros cruzados DEAL->TASK, que podem não refletir
 * corretamente a janela de datas).
 */
export async function fetchTaskAssociationsForDeals(
  dealIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (dealIds.length === 0) return map;

  const chunkSize = 100;
  for (let i = 0; i < dealIds.length; i += chunkSize) {
    const chunk = dealIds.slice(i, i + chunkSize);
    const response = await hubspotFetch<HubspotAssociationsResponse>(
      '/crm/v4/associations/deals/tasks/batch/read',
      {
        method: 'POST',
        body: JSON.stringify({ inputs: chunk.map((id) => ({ id })) }),
      },
    );

    for (const item of response.results) {
      map.set(
        item.from.id,
        item.to.map((t) => t.id),
      );
    }
  }

  return map;
}

/** Busca detalhes (propriedades) de um conjunto de tasks pelo ID, em batch. */
export async function fetchTasksByIds(
  taskIds: string[],
): Promise<Map<string, Record<string, string | null>>> {
  const map = new Map<string, Record<string, string | null>>();
  if (taskIds.length === 0) return map;

  const chunkSize = 100;
  for (let i = 0; i < taskIds.length; i += chunkSize) {
    const chunk = taskIds.slice(i, i + chunkSize);
    const response = await hubspotFetch<HubspotTaskBatchResponse>(
      '/crm/v3/objects/tasks/batch/read',
      {
        method: 'POST',
        body: JSON.stringify({
          properties: TASK_PROPERTIES,
          inputs: chunk.map((id) => ({ id })),
        }),
      },
    );

    for (const item of response.results) {
      map.set(item.id, item.properties);
    }
  }

  return map;
}

export type { HubspotDealResult };
