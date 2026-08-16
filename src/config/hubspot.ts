/**
 * Configuração de mapeamento entre o HubSpot e o modelo de dados da aplicação.
 *
 * IMPORTANTE: ajuste os valores abaixo para o seu portal do HubSpot antes de
 * rodar a sincronização. Os nomes de propriedade default do HubSpot (como
 * `hubspot_owner_id`, `dealstage`, `pipeline`) não mudam, mas as propriedades
 * customizadas (etapa anterior, motivo da perda, canal de aquisição, ICP)
 * variam por portal — troque pelos "internal name" reais das suas propriedades
 * customizadas (visíveis em Configurações > Propriedades no HubSpot).
 */

export const HUBSPOT_PIPELINE_ID = process.env.HUBSPOT_PIPELINE_ID || 'default';
export const HUBSPOT_LOST_STAGE_ID = process.env.HUBSPOT_LOST_STAGE_ID || 'closedlost';

/** Nome interno das propriedades customizadas do deal no HubSpot. */
export const DEAL_PROPERTY_MAP = {
  etapaAnterior: 'qual_etapa_do_funil_', // TODO: ajustar
  motivoPerda: 'motivo_do_perdido', // TODO: ajustar para a propriedade real de motivo de perda
  canalAquisicao: 'canal_de_aquisicao_1', // TODO: ajustar
  icp: 'icp_lead_negocio', // TODO: ajustar
} as const;

/**
 * Lista de todas as propriedades de deal buscadas na API do HubSpot.
 * Mantida separada do map acima para facilitar a extensão futura.
 */
export const DEAL_PROPERTIES = [
  'dealname',
  'dealstage',
  'pipeline',
  'hubspot_owner_id',
  'closedate',
  'createdate',
  DEAL_PROPERTY_MAP.etapaAnterior,
  DEAL_PROPERTY_MAP.motivoPerda,
  DEAL_PROPERTY_MAP.canalAquisicao,
  DEAL_PROPERTY_MAP.icp,
];

export const TASK_PROPERTIES = ['hs_task_status', 'hs_task_completion_date', 'hs_timestamp'];

/**
 * Mapa hubspot_owner_id -> nome do vendedor, usado apenas como fallback/seed
 * inicial da tabela `vendors`. Prefira manter essa lista atualizada
 * diretamente na tabela `vendors` do Supabase; este mapa só é usado para
 * popular vendedores novos encontrados durante a sincronização caso ainda
 * não existam no banco.
 */
export const VENDOR_SEED_MAP: Record<string, string> = {
  // '123456789': 'Nome do Vendedor',
};

/** Regra de atraso de tarefa, em dias — ver seção 1 do prompt original. */
export const ATRASO_LIMITE_DIAS = 2;
