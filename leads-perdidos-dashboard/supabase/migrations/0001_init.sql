-- Dashboard de Leads Perdidos (Inside Sales) — schema inicial
-- Rodar via `supabase db push` ou colar no SQL editor do painel Supabase.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table if not exists vendors (
  id text primary key,               -- hubspot_owner_id
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists deals (
  id bigint primary key,             -- hs_object_id do deal
  vendor_id text references vendors(id) on delete set null,
  dealname text,
  etapa_anterior text,
  motivo text,
  canal text,
  icp text,
  closedate date,
  createdate date,
  atraso boolean not null default false,
  num_tarefas int not null default 0,
  maior_atraso_dias int not null default 0,
  synced_at timestamptz not null default now()
);

create table if not exists tasks (
  id bigint primary key,             -- hs_object_id da task
  deal_id bigint references deals(id) on delete cascade,
  due_date date,
  completion_date date,
  status text                        -- COMPLETED, NOT_STARTED, WAITING, IN_PROGRESS, DEFERRED
);

create table if not exists sync_log (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  deals_synced int,
  status text,                       -- running | success | error
  error_message text
);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------

create index if not exists idx_deals_vendor_id on deals(vendor_id);
create index if not exists idx_deals_closedate on deals(closedate);
create index if not exists idx_deals_atraso on deals(atraso);
create index if not exists idx_tasks_deal_id on tasks(deal_id);
create index if not exists idx_sync_log_started_at on sync_log(started_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table vendors enable row level security;
alter table deals enable row level security;
alter table tasks enable row level security;
alter table sync_log enable row level security;

-- Leitura liberada para qualquer usuário autenticado (login restrito ao
-- domínio da empresa é aplicado na camada de auth/middleware da aplicação).
create policy "Authenticated users can read vendors"
  on vendors for select
  to authenticated
  using (true);

create policy "Authenticated users can read deals"
  on deals for select
  to authenticated
  using (true);

create policy "Authenticated users can read tasks"
  on tasks for select
  to authenticated
  using (true);

create policy "Authenticated users can read sync_log"
  on sync_log for select
  to authenticated
  using (true);

-- Nenhuma policy de insert/update/delete é criada para os papéis
-- `anon`/`authenticated`: escrita só é possível via service_role key,
-- usada exclusivamente no servidor (rota /api/sync), que ignora RLS.

-- ---------------------------------------------------------------------------
-- Seed opcional de vendedores (ajuste os IDs para os hubspot_owner_id reais)
-- ---------------------------------------------------------------------------

-- insert into vendors (id, name) values
--   ('000000001', 'Fulano de Tal'),
--   ('000000002', 'Ciclana Souza')
-- on conflict (id) do nothing;
