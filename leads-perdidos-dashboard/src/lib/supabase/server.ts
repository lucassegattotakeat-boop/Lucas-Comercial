import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cliente Supabase para uso em Server Components / Route Handlers / Server
 * Actions. Usa a anon key + cookies de sessão do usuário logado — respeita
 * RLS (somente leitura para usuários autenticados).
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // chamado de um Server Component sem permissão de escrita de
            // cookies — o middleware já cuida de refresh de sessão.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // ver comentário acima
          }
        },
      },
    },
  );
}
