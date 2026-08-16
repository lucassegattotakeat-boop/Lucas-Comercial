/**
 * Script de linha de comando para rodar a sincronização manualmente —
 * usado principalmente para o backfill inicial do histórico, antes de
 * ativar o Vercel Cron.
 *
 * Uso:
 *   npm run sync:cli -- --from=2026-01-01 --to=2026-01-31
 *
 * Requer um arquivo .env.local com as mesmas variáveis de ambiente da
 * aplicação (HUBSPOT_ACCESS_TOKEN, NEXT_PUBLIC_SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY).
 */
import 'dotenv/config';
import { runSync } from '../src/lib/sync';
import { getCurrentMonthRange } from '../src/lib/date-range';

function parseArg(name: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg?.split('=')[1];
}

async function main() {
  const defaultRange = getCurrentMonthRange();
  const from = parseArg('from') ?? defaultRange.from;
  const to = parseArg('to') ?? defaultRange.to;

  console.log(`Rodando sincronização de ${from} até ${to}...`);
  const result = await runSync(from, to);
  console.log('Sincronização concluída:', result);
}

main().catch((error) => {
  console.error('Sincronização falhou:', error);
  process.exit(1);
});
