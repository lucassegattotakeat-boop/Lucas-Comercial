export type IcpLevel = 'Baixo' | 'Médio' | 'Alto' | 'Não encontrado';

export interface Vendor {
  id: string;
  name: string;
  active: boolean;
}

export interface Deal {
  id: number;
  vendor_id: string | null;
  dealname: string | null;
  etapa_anterior: string | null;
  motivo: string | null;
  canal: string | null;
  icp: string | null;
  closedate: string | null; // ISO date
  createdate: string | null; // ISO date
  atraso: boolean;
  num_tarefas: number;
  maior_atraso_dias: number;
  synced_at: string;
}

export interface Task {
  id: number;
  deal_id: number;
  due_date: string | null;
  completion_date: string | null;
  status: 'COMPLETED' | 'NOT_STARTED' | 'WAITING' | 'IN_PROGRESS' | 'DEFERRED' | string | null;
}

export interface SyncLog {
  id: string;
  started_at: string;
  finished_at: string | null;
  deals_synced: number | null;
  status: 'running' | 'success' | 'error' | null;
  error_message: string | null;
}

export interface DateRange {
  from: string; // ISO date (yyyy-MM-dd)
  to: string; // ISO date (yyyy-MM-dd)
}

export interface VendorSummary {
  vendor: Vendor;
  total: number;
  comAtraso: number;
  semTarefa: number;
  percentAtraso: number;
}

export interface BreakdownItem {
  label: string;
  count: number;
  percent: number;
}
