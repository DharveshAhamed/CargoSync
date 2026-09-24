'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';

export default function SettingsPage() {
  const user = getUser();
  const [company, setCompany] = useState<any>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data } = await api.get('/auth/invites');
      setInvites(data);
    } catch (err: any) { console.error("Operation failed:", err.response?.data?.detail || err.message); }
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/invite', { email: inviteEmail, role: inviteRole });
      setInviteEmail('');
      loadData();
    } catch (err: any) { console.error("Operation failed:", err.response?.data?.detail || err.message); }
  };

  const inputStyle = { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Manage your company profile and team</p>
      </div>

      {/* Profile */}
      <div className="p-6 rounded-2xl mb-6" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}>
        <h2 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Name</label>
            <p className="text-sm px-4 py-2.5 rounded-xl" style={{ ...inputStyle }}>{user?.name}</p>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
            <p className="text-sm px-4 py-2.5 rounded-xl" style={{ ...inputStyle }}>{user?.email}</p>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Role</label>
            <p className="text-sm px-4 py-2.5 rounded-xl capitalize" style={{ ...inputStyle }}>{user?.role}</p>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Company</label>
            <p className="text-sm px-4 py-2.5 rounded-xl" style={{ ...inputStyle }}>{user?.company_name || '—'}</p>
          </div>
        </div>
      </div>

      {/* Team invites */}
      <div className="p-6 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}>
        <h2 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Team Members</h2>

        <form onSubmit={sendInvite} className="flex gap-3 mb-6">
          <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required type="email" placeholder="Email address"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
            className="px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle}>
            <option value="user">User</option>
            <option value="manager">Manager</option>
            <option value="driver">Driver</option>
          </select>
          <button type="submit" className="px-5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-all" style={{ backgroundColor: 'var(--color-primary)' }}>
            Invite
          </button>
        </form>

        <div className="space-y-2">
          {invites.map((inv: any) => (
            <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--color-surface)' }}>
              <div>
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>{inv.email}</p>
                <p className="text-xs capitalize" style={{ color: 'var(--color-text-muted)' }}>{inv.role}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${inv.status === 'accepted' ? 'status-delivered' : inv.status === 'pending' ? 'status-posted' : 'status-draft'}`}>
                {inv.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
