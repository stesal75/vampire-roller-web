'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  const inputClass = 'w-full bg-[#0a0707] border border-[#2a1515] text-[#d4c5a9] px-3 py-2 rounded font-serif text-sm focus:outline-none focus:border-red-900';

  return (
    <main className="min-h-screen bg-[#0d0a0a] text-[#d4c5a9] font-serif flex flex-col items-center justify-center px-6">
      <h1
        className="text-2xl tracking-[4px] uppercase text-red-600 mb-8"
        style={{ textShadow: '0 0 18px rgba(180,20,20,0.4)' }}
      >
        ⚔ Vampire Roller
      </h1>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-4 bg-[#130d0d] border border-[#2a1515] rounded p-6"
      >
        {sent ? (
          <p className="text-sm text-center">
            Se lo username esiste, è stata inviata un&apos;email con il link per impostare una nuova password.
          </p>
        ) : (
          <>
            <div>
              <label className="block text-[0.6rem] uppercase tracking-[3px] text-red-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className={inputClass}
                autoComplete="username"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full bg-red-900 text-[#d4c5a9] py-2 rounded font-serif text-sm tracking-widest uppercase hover:bg-red-700 transition-colors disabled:opacity-40"
            >
              {loading ? 'Invio...' : 'Invia link di reset'}
            </button>
          </>
        )}

        <Link href="/login" className="text-center text-xs text-red-700 hover:text-red-500 mt-2">
          ← Torna al login
        </Link>
      </form>
    </main>
  );
}
