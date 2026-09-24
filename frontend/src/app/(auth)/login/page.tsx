'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { saveAuth } from '@/lib/auth';

export default function LoginPage() {
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
      const { data } = await api.post('/auth/login', { email, password });
      saveAuth(data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left side — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
        }}
      >
        <div className="max-w-md text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">CargoSync</h1>
            <p className="text-white/80 text-lg leading-relaxed">
              Intelligent Freight & Fleet Orchestration. Streamline your logistics with 3D load planning, QR tracking, and real-time delivery management.
            </p>
          </div>
          <div className="flex gap-6 justify-center text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
              3D Load Planning
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
              QR Tracking
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
              POD Capture
            </div>
          </div>
        </div>
      </div>

      {/* Right side — login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>CargoSync</h1>
            <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>Freight & Fleet Orchestration</p>
          </div>

          <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Welcome back</h2>
          <p className="mb-8" style={{ color: 'var(--color-text-secondary)' }}>Sign in to your company account</p>

          {error && (
            <div className="mb-6 p-4 rounded-lg text-sm" style={{ backgroundColor: '#C25B5615', color: 'var(--color-danger)', border: '1px solid #C25B5630' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm focus:ring-2 focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm focus:ring-2 focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
                <input type="checkbox" className="rounded" style={{ accentColor: 'var(--color-primary)' }} />
                Remember me
              </label>
              <Link
                href="/reset-password"
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--color-primary)' }}
              >
                Forgot password?
              </Link>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all"
              style={{ backgroundColor: 'var(--color-primary)', boxShadow: 'var(--shadow-warm)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 text-center space-y-3">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
                Register your company
              </Link>
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <Link href="/admin/login" className="hover:underline" style={{ color: 'var(--color-text-muted)' }}>
                Admin login →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
