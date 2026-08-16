'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SyncButton({ lastSyncedAt }: { lastSyncedAt: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error ?? 'Falha ao sincronizar.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao sincronizar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-60"
      >
        {loading ? 'Sincronizando…' : 'Sincronizar agora'}
      </button>
      <span className="text-xs text-slate-400">
        {lastSyncedAt ? `Última sincronização: ${new Date(lastSyncedAt).toLocaleString('pt-BR')}` : 'Nunca sincronizado'}
      </span>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
