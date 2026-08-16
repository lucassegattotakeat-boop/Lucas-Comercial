'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface LoginActionState {
  status: 'idle' | 'sent' | 'error';
  message?: string;
}

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'takeat.app';

export async function requestMagicLink(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get('email') || '')
    .trim()
    .toLowerCase();

  if (!email || !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    return { status: 'error', message: `Use um e-mail do domínio @${ALLOWED_DOMAIN}.` };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    return { status: 'error', message: error.message };
  }

  return { status: 'sent', message: `Enviamos um link de acesso para ${email}.` };
}
