# Leads Perdidos — Inside Sales

Dashboard para acompanhar os leads perdidos (`dealstage = closedlost`) do
pipeline **Inside Sales** (`pipeline = default`) no HubSpot, substituindo o
relatório HTML estático gerado manualmente. Next.js + Supabase (Postgres) +
Vercel, com sincronização periódica via Vercel Cron.

## Stack

- **Frontend + Backend**: Next.js 14 (App Router), TypeScript, Tailwind CSS.
- **Banco de dados**: Supabase (Postgres), com Row Level Security.
- **Autenticação**: Supabase Auth (magic link), restrita ao domínio da empresa.
- **Sincronização**: rota `/api/sync`, chamada pelo Vercel Cron a cada 6h e
  por um botão "Sincronizar agora" na UI.

## 1. Pré-requisitos

- Node.js 20+
- Uma conta HubSpot com permissão para criar um Private App
- Uma conta Supabase
- Uma conta Vercel

## 2. Criando o Private App no HubSpot

1. No HubSpot, vá em **Configurações → Integrações → Private Apps → Criar
   app privado**.
2. Na aba **Scopes**, habilite (no mínimo):
   - `crm.objects.deals.read`
   - `crm.objects.tasks.read`
   - `crm.schemas.deals.read`
3. Crie o app e copie o **Access Token** gerado — ele vai para a variável
   `HUBSPOT_ACCESS_TOKEN`.
4. Confira o **internal name** das suas propriedades customizadas de deal
   (etapa anterior, motivo da perda, canal de aquisição, ICP) em
   **Configurações → Propriedades → Deals**, e ajuste
   `src/config/hubspot.ts` (`DEAL_PROPERTY_MAP`) com os nomes reais do seu
   portal — os valores no repositório são placeholders (`TODO`).
5. Confirme também o `pipeline` id e o `dealstage` id de "Perdido" do seu
   portal (podem ser vistos na URL do funil ou via API
   `/crm/v3/pipelines/deals`) e ajuste as variáveis de ambiente
   `HUBSPOT_PIPELINE_ID` / `HUBSPOT_LOST_STAGE_ID` se forem diferentes de
   `default` / `closedlost`.

## 3. Criando o projeto Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (segredo — nunca vai
     para o client nem para o repositório)
3. Rode as migrations do schema (arquivo `supabase/migrations/0001_init.sql`):
   - Via Supabase CLI: `supabase link --project-ref <seu-projeto>` e depois
     `supabase db push`; ou
   - Colando o conteúdo do arquivo diretamente no **SQL Editor** do painel
     Supabase.
4. Em **Authentication → URL Configuration**, adicione a URL de produção
   (e `http://localhost:3000` em desenvolvimento) em **Redirect URLs**,
   incluindo o caminho `/auth/callback` (ex.:
   `https://seu-dominio.vercel.app/auth/callback`).
5. (Opcional) Popule a tabela `vendors` manualmente com os vendedores do
   time e seus `hubspot_owner_id` — veja o exemplo comentado no final da
   migration. Se não fizer isso, a própria sincronização cria os
   vendedores automaticamente na primeira vez que encontrar um
   `hubspot_owner_id` novo (com um nome genérico `Vendedor <id>` até você
   renomear).

## 4. Configuração local

```bash
npm install
cp .env.example .env.local
# preencha .env.local com os valores das seções 2 e 3 acima
npm run dev
```

Acesse `http://localhost:3000` — você será redirecionado para `/login`.
Use um e-mail do domínio configurado em `ALLOWED_EMAIL_DOMAIN` (padrão:
`takeat.app`) para receber o magic link.

## 5. Backfill inicial (histórico)

Antes de ativar o cron, rode a sincronização manualmente para o período
histórico desejado:

```bash
npm run sync:cli -- --from=2026-01-01 --to=2026-06-30
```

Isso popula `deals`, `tasks` e `vendors` no Supabase sem depender do cron.

## 6. Deploy na Vercel

1. Importe o repositório na Vercel.
2. Configure as variáveis de ambiente (mesmas do `.env.local`), incluindo
   `CRON_SECRET` — uma string aleatória gerada por você
   (`openssl rand -hex 32`, por exemplo). A Vercel injeta automaticamente o
   header `Authorization: Bearer $CRON_SECRET` nas chamadas do Cron Job, e a
   rota `/api/sync` valida esse header.
3. O arquivo `vercel.json` já configura o Cron Job para rodar `/api/sync` a
   cada 6 horas — nenhuma configuração extra é necessária além de garantir
   que `CRON_SECRET` esteja definido nas variáveis de ambiente do projeto.
4. Depois do primeiro deploy, atualize a Redirect URL no Supabase Auth com
   o domínio final de produção.

## 7. Estrutura do projeto

```
src/
  app/
    dashboard/page.tsx       # página principal (Server Component)
    login/                   # login por magic link
    auth/callback/route.ts   # troca o código do magic link por sessão
    api/sync/route.ts        # rota de sincronização (cron + botão manual)
  components/                # UI (tabs por vendedor, tabela, gráficos, etc.)
  lib/
    hubspot.ts                # client HubSpot (busca deals, tasks, associations)
    delay.ts                  # regra de cálculo do indicador de atraso
    sync.ts                   # orquestra sync HubSpot -> Supabase
    queries.ts                # queries de leitura para a UI (Supabase)
    supabase/                 # clients Supabase (browser, server, admin)
  config/hubspot.ts           # mapeamento de propriedades HubSpot (AJUSTAR)
supabase/migrations/0001_init.sql
scripts/run-sync.ts           # CLI para backfill manual
```

## 8. Regra de "atraso de tarefa"

Um lead é considerado com atraso se qualquer tarefa associada:

- foi concluída mais de 2 dias após o vencimento (`due_date`), **ou**
- ficou em aberto (não concluída) com vencimento mais de 2 dias antes da
  data em que o lead foi marcado como perdido (`closedate`).

O limite de dias é configurável em `src/config/hubspot.ts`
(`ATRASO_LIMITE_DIAS`). A lógica está isolada em `src/lib/delay.ts` para
facilitar testes e ajustes.

## 9. Pontos de atenção / próximos ajustes

- **Ajuste obrigatório**: os internal names das propriedades customizadas
  em `src/config/hubspot.ts` são placeholders — o sync não vai funcionar
  corretamente até que sejam corrigidos para o seu portal.
- A lista de vendedores é criada automaticamente na sincronização, mas os
  nomes (`Vendedor <id>`) devem ser corrigidos manualmente na tabela
  `vendors` do Supabase (ou via um painel de administração futuro).
- Para multi-time, generalize a tabela `vendors` com uma coluna `team` e
  parametrize `HUBSPOT_PIPELINE_ID` por time.      
