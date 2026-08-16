'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { requestMagicLink, type LoginActionState } from './actions';

const initialState: LoginActionState = { status: 'idle' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand-500 px-4 py-2.5 font-medium text-white transition hover:bg-brand-600 disabled:opacity-60"
    >
      {pending ? 'Enviando…' : 'Enviar link de acesso'}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(requestMagicLink, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Leads Perdidos — Inside Sales</h1>
        <p className="mt-1 text-sm text-slate-500">
          Acesso restrito ao time. Informe seu e-mail corporativo para receber um link de login.
        </p>

        <form action={formAction} className="mt-6 space-y-3">
          <input
            type="email"
            name="email"
            required
            placeholder="voce@takeat.app"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          <SubmitButton />
        </form>

        {state.status === 'sent' && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.message}</p>
        )}
        {state.status === 'error' && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>
        )}
      </div>
    </div>
  );
}
