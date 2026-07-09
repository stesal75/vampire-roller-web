'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Le password non coincidono');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore durante il reset');
      } else {
        setDone(true);
        setTimeout(() => router.push('/login'), 2000);
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'w-full bg-[#0a0707] border border-[#2a1515] text-[#d4c5a9] px-3 py-2 rounded font-serif text-sm focus:outline-none focus:border-red-900';

  if (!token) {
    return <p className="text-red-500 text-sm text-center">Link non valido: token mancante.</p>;
  }

  if (done) {
    return <p className="text-sm text-center">Password aggiornata. Reindirizzamento al login...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-[0.6rem] uppercase tracking-[3px] text-red-700 mb-1">Nuova password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className={inputClass}
          autoComplete="new-password"
          required
        />
      </div>

      <div>
        <label className="block text-[0.6rem] uppercase tracking-[3px] text-red-700 mb-1">Conferma password</label>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className={inputClass}
          autoComplete="new-password"
          required
        />
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 w-full bg-red-900 text-[#d4c5a9] py-2 rounded font-serif text-sm tracking-widest uppercase hover:bg-red-700 transition-colors disabled:opacity-40"
      >
        {loading ? 'Salvataggio...' : 'Imposta nuova password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#0d0a0a] text-[#d4c5a9] font-serif flex flex-col items-center justify-center px-6">
      <h1
        className="text-2xl tracking-[4px] uppercase text-red-600 mb-8"
        style={{ textShadow: '0 0 18px rgba(180,20,20,0.4)' }}
      >
        ⚔ Vampire Roller
      </h1>

      <div className="w-full max-w-sm bg-[#130d0d] border border-[#2a1515] rounded p-6">
        <Suspense fallback={<p className="text-sm text-center">Caricamento...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
