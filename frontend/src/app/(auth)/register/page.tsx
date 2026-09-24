'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { saveAuth } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    company_name: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        company_name: form.company_name,
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        address: form.address || undefined,
      });
      saveAuth(data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>CargoSync</h1>
          <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>Register your company</p>
        </div>

        <div className="p-8 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border-light)' }}>
          {error && (
            <div className="mb-6 p-4 rounded-lg text-sm" style={{ backgroundColor: '#C25B5615', color: 'var(--color-danger)', border: '1px solid #C25B5630' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Company Name</label>
              <input id="register-company" name="company_name" value={form.company_name} onChange={handleChange} required
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} placeholder="Acme Logistics" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Your Name</label>
                <input id="register-name" name="name" value={form.name} onChange={handleChange} required
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Phone</label>
                <input id="register-phone" name="phone" value={form.phone} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} placeholder="+1 234 567 8900" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Email</label>
              <input id="register-email" name="email" type="email" value={form.email} onChange={handleChange} required
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} placeholder="you@company.com" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Address</label>
              <textarea id="register-address" name="address" value={form.address} onChange={handleChange} rows={2}
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none resize-none" style={inputStyle} placeholder="123 Logistics Ave, Suite 100" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Password</label>
                <input id="register-password" name="password" type="password" value={form.password} onChange={handleChange} required
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} placeholder="Min. 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Confirm Password</label>
                <input id="register-confirm" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} placeholder="••••••••" />
              </div>
            </div>

            <button id="register-submit" type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 mt-2 transition-all"
              style={{ backgroundColor: 'var(--color-primary)', boxShadow: 'var(--shadow-warm)' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
