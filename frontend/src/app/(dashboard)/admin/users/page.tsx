'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company_id: '', name: '', email: '', password: '', role: 'user' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [u, c] = await Promise.all([api.get('/admin/users'), api.get('/admin/companies')]);
      setUsers(u.data);
      setCompanies(c.data);
    } catch (err: any) { console.error("Operation failed:", err.response?.data?.detail || err.message); }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/admin/users', form); setShowForm(false); loadData(); } catch (err: any) { console.error("Operation failed:", err.response?.data?.detail || err.message); }
  };

  const inputStyle = { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Admin — Users</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Manage all platform users</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-all" style={{ backgroundColor: 'var(--color-primary)' }}>+ Add User</button>
      </div>

      {showForm && (
        <form onSubmit={createUser} className="p-5 rounded-2xl mb-6 animate-fade-in" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border-light)' }}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <select value={form.company_id} onChange={e => setForm({...form, company_id: e.target.value})} required className="px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle}>
              <option value="">Select company...</option>
              {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Full name" className="px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
            <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} required type="email" placeholder="Email" className="px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
            <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} required type="password" placeholder="Password" className="px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle}>
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="driver">Driver</option>
            </select>
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: 'var(--color-primary)' }}>Create User</button>
        </form>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
              <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--color-text-secondary)' }}>Name</th>
              <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--color-text-secondary)' }}>Email</th>
              <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--color-text-secondary)' }}>Role</th>
              <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--color-text-secondary)' }}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{u.name}</td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{u.email}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize" style={{ backgroundColor: 'var(--color-primary)' + '15', color: 'var(--color-primary)' }}>{u.role}</span></td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
