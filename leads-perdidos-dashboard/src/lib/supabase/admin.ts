import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase com a service_role key — ignora RLS. Uso EXCLUSIVO em
 * código server-side de confiança (rota /api/sync). Nunca importar este
 * módulo em Client Components ou em código que possa acabar no bundle do
 * navegador.
 */
export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL não configurados.',
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
