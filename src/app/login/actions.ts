'use server';

import { headers } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface LoginActionState {
  status: 'idle' | 'sent' | 'error';
  message?: string;
}

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'takeat.app';

function isAllowedEmail(email: string): boolean {
  if (email.endsWith(`@${ALLOWED_DOMAIN}`)) return true;
  // Padrão usado pelo time: nome.takeat@gmail.com
  if (/^[a-z0-9._%+-]+\.takeat@gmail\.com$/i.test(email)) return true;
  return false;
}

function getSiteOrigin(): string {
  const requestHeaders = headers();
  const host = requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https';
  return host ? `${protocol}://${host}` : 'https://lucascomercial.vercel.app';
}

export async function requestMagicLink(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get('email') || '')
    .trim()
    .toLowerCase();

  if (!email || !isAllowedEmail(email)) {
    return {
      status: 'error',
      message: `Use um e-mail do domínio @${ALLOWED_DOMAIN} ou do padrão nome.takeat@gmail.com.`,
    };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${getSiteOrigin()}/auth/callback`,
    },
  });

  if (error) {
    return { status: 'error', message: error.message };
  }

  return { status: 'sent', message: `Enviamos um link de acesso para ${email}.` };
}
