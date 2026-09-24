'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [companiesRes, statsRes] = await Promise.all([
        api.get('/admin/companies'),
        api.get('/admin/dashboard'),
      ]);
      setCompanies(companiesRes.data);
      setStats(statsRes.data);
    } catch (err: any) { console.error("Operation failed:", err.response?.data?.detail || err.message); }
  };

  const createCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/admin/companies', form); setShowForm(false); setForm({ name: '', email: '', phone: '', address: '' }); loadData(); } catch (err: any) { console.error("Operation failed:", err.response?.data?.detail || err.message); }
  };

  const inputStyle = { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Admin — Companies</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Platform-wide company management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Companies', value: stats.total_companies },
          { label: 'Users', value: stats.total_users },
          { label: 'Active Jobs', value: stats.active_jobs },
          { label: 'Completed', value: stats.completed_jobs },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{s.value || 0}</p>
          </div>
        ))}
      </div>

      <button onClick={() => setShowForm(!showForm)} className="px-4 py-2.5 rounded-xl text-white text-sm font-medium mb-4 hover:opacity-90 transition-all" style={{ backgroundColor: 'var(--color-primary)' }}>+ Register Company</button>

      {showForm && (
        <form onSubmit={createCompany} className="p-5 rounded-2xl mb-6 animate-fade-in" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border-light)' }}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Company name" className="px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
            <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} required type="email" placeholder="Email" className="px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone" className="px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
            <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Address" className="px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: 'var(--color-primary)' }}>Create</button>
        </form>
      )}

      <div className="space-y-3">
        {companies.map((c: any) => (
          <div key={c.id} className="p-4 rounded-2xl flex items-center justify-between" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{c.name}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{c.email} • Joined {new Date(c.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
