'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/password-reset', { email });
      setSent(true);
    } catch {
      setSent(true); // Don't reveal whether email exists
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>CargoSync</h1>
          <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>Reset your password</p>
        </div>

        <div className="p-8 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border-light)' }}>
          {sent ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#6B8F7120' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Check your email</h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                If an account exists with <strong>{email}</strong>, we&apos;ve sent a reset link.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>Email</label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  placeholder="your@email.com"
                />
              </div>
              <button
                id="reset-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <Link href="/login" className="hover:underline" style={{ color: 'var(--color-primary)' }}>
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
