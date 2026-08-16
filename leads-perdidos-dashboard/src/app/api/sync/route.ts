import { NextResponse, type NextRequest } from 'next/server';
import { runSync } from '@/lib/sync';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentMonthRange, isValidIsoDate } from '@/lib/date-range';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // segundos — sincronizações grandes podem demorar

function isAuthorizedCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

async function isAuthorizedUserRequest(): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}

async function handleSync(request: NextRequest) {
  const isCron = isAuthorizedCronRequest(request);
  const isUser = isCron ? true : await isAuthorizedUserRequest();

  if (!isCron && !isUser) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const fromParam = url.searchParams.get('from');
  const toParam = url.searchParams.get('to');

  const defaultRange = getCurrentMonthRange();
  const from = isValidIsoDate(fromParam) ? fromParam : defaultRange.from;
  const to = isValidIsoDate(toParam) ? toParam : defaultRange.to;

  try {
    const result = await runSync(from, to);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// O Vercel Cron faz requisições GET.
export async function GET(request: NextRequest) {
  return handleSync(request);
}

// O botão "Sincronizar agora" da UI faz uma requisição POST autenticada.
export async function POST(request: NextRequest) {
  return handleSync(request);
}
