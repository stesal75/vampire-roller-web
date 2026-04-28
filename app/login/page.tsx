'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore di accesso');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
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
        onSubmit={handleLogin}
        className="w-full max-w-sm flex flex-col gap-4 bg-[#130d0d] border border-[#2a1515] rounded p-6"
      >
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

        <div>
          <label className="block text-[0.6rem] uppercase tracking-[3px] text-red-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={inputClass}
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full bg-red-900 text-[#d4c5a9] py-2 rounded font-serif text-sm tracking-widest uppercase hover:bg-red-700 transition-colors disabled:opacity-40"
        >
          {loading ? 'Accesso...' : 'Accedi'}
        </button>
      </form>

    </main>
  );
}
