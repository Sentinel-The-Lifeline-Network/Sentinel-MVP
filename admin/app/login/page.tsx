'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Login failed');
      }
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <img src="/icon.svg" alt="" className="w-12 h-12 rounded-xl mb-3" />
          <h1 className="font-heading text-lg font-bold">Sentinel Admin</h1>
          <p className="text-sm text-muted mt-1 text-center">Enter the admin password to continue.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-muted">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoFocus
            className="w-full mt-2 bg-surface border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
          />

          {error && <p className="text-sm text-danger mt-3">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full mt-4 py-3 rounded-xl text-sm font-semibold bg-primary text-white disabled:opacity-60 hover:bg-primary-light transition-colors"
          >
            {busy ? 'Checking...' : 'Sign in'}
          </button>
        </div>

        <p className="text-xs text-muted text-center mt-4">Internal use only · Not linked from the public app</p>
      </form>
    </div>
  );
}
