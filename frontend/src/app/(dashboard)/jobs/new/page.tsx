'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Truck } from '@/types';

export default function NewJobPage() {
  const router = useRouter();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [form, setForm] = useState({ job_name: '', date: '', truck_id: '', time_window: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/trucks/').then(({ data }) => setTrucks(data.filter((t: Truck) => t.is_active))).catch((err: any) => {
      setError(err.response?.data?.detail || 'Failed to load trucks');
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/jobs/', {
        ...form,
        truck_id: form.truck_id || undefined,
        time_window: form.time_window || undefined,
      });
      router.push(`/jobs/${data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Create New Job</h1>

      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm flex items-center justify-between" style={{ backgroundColor: '#C25B5615', color: 'var(--color-danger)', border: '1px solid #C25B5630' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-4 font-bold hover:opacity-70">×</button>
        </div>
      )}

      <div className="p-6 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border-light)' }}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Job Name</label>
            <input value={form.job_name} onChange={e => setForm({...form, job_name: e.target.value})} required
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} placeholder="e.g. Mumbai to Delhi Shipment" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Time Window</label>
              <input value={form.time_window} onChange={e => setForm({...form, time_window: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} placeholder="e.g. 09:00-17:00" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Assign Truck (optional)</label>
            <select value={form.truck_id} onChange={e => setForm({...form, truck_id: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle}>
              <option value="">Select a truck...</option>
              {trucks.map(t => <option key={t.id} value={t.id}>{t.truck_name} ({t.plate_number})</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
              style={{ backgroundColor: 'var(--color-primary)', boxShadow: 'var(--shadow-warm)' }}>
              {loading ? 'Creating...' : 'Create Job'}
            </button>
            <button type="button" onClick={() => router.back()}
              className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
