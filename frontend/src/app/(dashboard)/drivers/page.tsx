'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Driver, Truck } from '@/types';

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', license_number: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedTruckId, setSelectedTruckId] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setPageLoading(true);
    try {
      const [driversRes, trucksRes] = await Promise.all([
        api.get('/drivers/'),
        api.get('/trucks/'),
      ]);
      setDrivers(driversRes.data);
      setTrucks(trucksRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setPageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/drivers/${editing.id}`, form);
      } else {
        await api.post('/drivers/', form);
      }
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save driver');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditing(driver);
    setForm({
      name: driver.name,
      email: driver.email || '',
      phone: driver.phone || '',
      license_number: driver.license_number || '',
      notes: driver.notes || '',
    });
    setShowForm(true);
    setError('');
  };

  const handleDeactivate = async (id: string) => {
    if (confirm('Deactivate this driver? They will be unassigned from their truck.')) {
      try {
        await api.delete(`/drivers/${id}`);
        loadData();
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to deactivate driver');
      }
    }
  };

  const handleAssign = async (driverId: string) => {
    if (!selectedTruckId) return;
    setError('');
    try {
      await api.post(`/drivers/${driverId}/assign/${selectedTruckId}`);
      setAssigningId(null);
      setSelectedTruckId('');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to assign driver');
    }
  };

  const handleUnassign = async (driverId: string) => {
    setError('');
    try {
      await api.post(`/drivers/${driverId}/unassign`);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to unassign driver');
    }
  };

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', license_number: '', notes: '' });
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const availableTrucks = trucks.filter(t => t.is_active && !drivers.some(d => d.truck_plate === t.plate_number));

  const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none";
  const inputStyle = { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Driver Management</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Add, manage, and assign drivers to your fleet vehicles</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-all"
          style={{ backgroundColor: 'var(--color-primary)', boxShadow: 'var(--shadow-warm)' }}>
          + Add Driver
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
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>{editing ? 'Edit Driver' : 'Add New Driver'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Driver Name *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className={inputClass} style={inputStyle} placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputClass} style={inputStyle} placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Phone</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputClass} style={inputStyle} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>License Number</label>
                <input value={form.license_number} onChange={e => setForm({...form, license_number: e.target.value})} className={inputClass} style={inputStyle} placeholder="DL-12345678" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Notes</label>
                <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={inputClass} style={inputStyle} placeholder="Any additional notes..." />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all" style={{ backgroundColor: 'var(--color-primary)' }}>
                {loading ? 'Saving...' : editing ? 'Update Driver' : 'Add Driver'}
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
                  <div className="h-3 rounded w-1/3" style={{ backgroundColor: 'var(--color-surface)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Driver list */
        <div className="grid gap-4">
          {drivers.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border-light)' }}>
              <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              <p style={{ color: 'var(--color-text-muted)' }}>No drivers added yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Click &quot;+ Add Driver&quot; to get started</p>
            </div>
          ) : (
            drivers.map((driver) => (
              <div key={driver.id} className="p-5 rounded-2xl transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)', opacity: driver.is_active ? 1 : 0.5 }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: 'var(--color-secondary)' }}>
                      {driver.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                        {driver.name}
                        {!driver.is_active && <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#C25B5615', color: 'var(--color-danger)' }}>Inactive</span>}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {driver.phone && `${driver.phone} • `}
                        {driver.license_number && `License: ${driver.license_number} • `}
                        {driver.truck_plate ? (
                          <span style={{ color: 'var(--color-secondary)' }}>Assigned to {driver.truck_plate}</span>
                        ) : (
                          <span>Unassigned</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Assign/Unassign */}
                    {driver.is_active && (
                      driver.truck_plate ? (
                        <button onClick={() => handleUnassign(driver.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-warning)', border: '1px solid var(--color-border)' }}>
                          Unassign
                        </button>
                      ) : assigningId === driver.id ? (
                        <div className="flex gap-2 items-center">
                          <select value={selectedTruckId} onChange={e => setSelectedTruckId(e.target.value)}
                            className="px-2 py-1.5 rounded-lg text-xs" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                            <option value="">Select truck...</option>
                            {availableTrucks.map(t => <option key={t.id} value={t.id}>{t.truck_name} ({t.plate_number})</option>)}
                          </select>
                          <button onClick={() => handleAssign(driver.id)} disabled={!selectedTruckId}
                            className="px-2 py-1.5 rounded-lg text-white text-xs font-medium disabled:opacity-50" style={{ backgroundColor: 'var(--color-primary)' }}>
                            Assign
                          </button>
                          <button onClick={() => { setAssigningId(null); setSelectedTruckId(''); }}
                            className="px-2 py-1.5 rounded-lg text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setAssigningId(driver.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ backgroundColor: 'var(--color-secondary)' + '15', color: 'var(--color-secondary)', border: '1px solid var(--color-secondary)' + '30' }}>
                          Assign to Truck
                        </button>
                      )
                    )}
                    <button onClick={() => handleEdit(driver)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>Edit</button>
                    {driver.is_active && (
                      <button onClick={() => handleDeactivate(driver.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ backgroundColor: '#C25B5610', color: 'var(--color-danger)', border: '1px solid #C25B5630' }}>Deactivate</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
