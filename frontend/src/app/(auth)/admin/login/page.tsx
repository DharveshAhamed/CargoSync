'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { saveAuth } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/admin/login', { email, password });
      saveAuth(data);
      router.push('/admin/companies');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ backgroundColor: 'var(--color-text)', color: 'white' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Admin Portal</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            CargoSync Platform Administration
          </p>
        </div>

        <div className="p-8 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border-light)' }}>
          {error && (
            <div className="mb-6 p-4 rounded-lg text-sm" style={{ backgroundColor: '#C25B5615', color: 'var(--color-danger)', border: '1px solid #C25B5630' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>Email</label>
              <input
                id="admin-login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm focus:ring-2 focus:outline-none"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                placeholder="admin@cargosync.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>Password</label>
              <input
                id="admin-login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm focus:ring-2 focus:outline-none"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                placeholder="••••••••"
              />
            </div>

            <button
              id="admin-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all"
              style={{ backgroundColor: 'var(--color-text)' }}
            >
              {loading ? 'Signing in...' : 'Sign in as Admin'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-sm space-y-3" style={{ color: 'var(--color-text-muted)' }}>
          <p>First time here? <Link href="/admin/register" className="font-semibold hover:underline" style={{color:'var(--color-text)'}}>Create the first admin account</Link></p>
          <p>
          <Link href="/login" className="hover:underline" style={{ color: 'var(--color-text-secondary)' }}>
            ← Back to all portals
          </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
