'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Truck } from '@/types';

export default function TrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Truck | null>(null);
  const [form, setForm] = useState({ truck_name: '', plate_number: '', length_cm: '', width_cm: '', height_cm: '', max_weight_kg: '', driver_name: '' });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadTrucks(); }, []);

  const loadTrucks = async () => {
    setPageLoading(true);
    try {
      const { data } = await api.get('/trucks/');
      setTrucks(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load trucks');
    } finally {
      setPageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form, length_cm: +form.length_cm, width_cm: +form.width_cm, height_cm: +form.height_cm, max_weight_kg: +form.max_weight_kg };
      if (editing) {
        await api.put(`/trucks/${editing.id}`, payload);
      } else {
        await api.post('/trucks/', payload);
      }
      resetForm();
      loadTrucks();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save truck');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (truck: Truck) => {
    setEditing(truck);
    setForm({
      truck_name: truck.truck_name, plate_number: truck.plate_number,
      length_cm: String(truck.length_cm), width_cm: String(truck.width_cm),
      height_cm: String(truck.height_cm), max_weight_kg: String(truck.max_weight_kg),
      driver_name: truck.driver_name || '',
    });
    setShowForm(true);
    setError('');
  };

  const handleDeactivate = async (id: string) => {
    if (confirm('Deactivate this truck?')) {
      try {
        await api.delete(`/trucks/${id}`);
        loadTrucks();
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to deactivate truck');
      }
    }
  };

  const resetForm = () => {
    setForm({ truck_name: '', plate_number: '', length_cm: '', width_cm: '', height_cm: '', max_weight_kg: '', driver_name: '' });
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none";
  const inputStyle = { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Truck Management</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Manage your fleet vehicles and cargo dimensions</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-all"
          style={{ backgroundColor: 'var(--color-primary)', boxShadow: 'var(--shadow-warm)' }}>
          + Add Truck
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm flex items-center justify-between" style={{ backgroundColor: '#C25B5615', color: 'var(--color-danger)', border: '1px solid #C25B5630' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-4 font-bold hover:opacity-70">×</button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-6 p-6 rounded-2xl animate-fade-in" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border-light)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>{editing ? 'Edit Truck' : 'Add New Truck'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Truck Name</label>
                <input value={form.truck_name} onChange={e => setForm({...form, truck_name: e.target.value})} required className={inputClass} style={inputStyle} placeholder="Volvo FH16" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Plate Number</label>
                <input value={form.plate_number} onChange={e => setForm({...form, plate_number: e.target.value})} required className={inputClass} style={inputStyle} placeholder="TN-01-AB-1234" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Driver Name</label>
                <input value={form.driver_name} onChange={e => setForm({...form, driver_name: e.target.value})} className={inputClass} style={inputStyle} placeholder="Optional" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Length (cm)</label>
                <input type="number" value={form.length_cm} onChange={e => setForm({...form, length_cm: e.target.value})} required className={inputClass} style={inputStyle} placeholder="600" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Width (cm)</label>
                <input type="number" value={form.width_cm} onChange={e => setForm({...form, width_cm: e.target.value})} required className={inputClass} style={inputStyle} placeholder="240" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Height (cm)</label>
                <input type="number" value={form.height_cm} onChange={e => setForm({...form, height_cm: e.target.value})} required className={inputClass} style={inputStyle} placeholder="270" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Max Weight (kg)</label>
                <input type="number" value={form.max_weight_kg} onChange={e => setForm({...form, max_weight_kg: e.target.value})} required className={inputClass} style={inputStyle} placeholder="20000" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all" style={{ backgroundColor: 'var(--color-primary)' }}>
                {loading ? 'Saving...' : editing ? 'Update Truck' : 'Add Truck'}
              </button>
              <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading state */}
      {pageLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-5 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border-light)' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl" style={{ backgroundColor: 'var(--color-surface)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded w-1/4" style={{ backgroundColor: 'var(--color-surface)' }} />
                  <div className="h-3 rounded w-1/2" style={{ backgroundColor: 'var(--color-surface)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Truck list */
        <div className="grid gap-4">
          {trucks.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border-light)' }}>
              <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <p style={{ color: 'var(--color-text-muted)' }}>No trucks added yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Click &quot;+ Add Truck&quot; to get started</p>
            </div>
          ) : (
            trucks.map((truck) => (
              <div key={truck.id} className="p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)', opacity: truck.is_active ? 1 : 0.5 }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' + '15' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" rx="2" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{truck.truck_name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {truck.plate_number} • {truck.length_cm}×{truck.width_cm}×{truck.height_cm} cm • {truck.max_weight_kg} kg
                      {truck.driver_name && ` • ${truck.driver_name}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(truck)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>Edit</button>
                  {truck.is_active && (
                    <button onClick={() => handleDeactivate(truck.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ backgroundColor: '#C25B5610', color: 'var(--color-danger)', border: '1px solid #C25B5630' }}>Deactivate</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
