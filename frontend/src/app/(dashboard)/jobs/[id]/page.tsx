'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import type { JobDetail } from '@/types';

export default function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [showAddBox, setShowAddBox] = useState(false);
  const [error, setError] = useState('');
  const [boxForm, setBoxForm] = useState({ label_reference: '', length_cm: '', width_cm: '', height_cm: '', weight_kg: '', stop_order: '1', fragile: false, hazard: false });

  useEffect(() => { if (id) loadJob(); }, [id]);

  const loadJob = async () => {
    try { const { data } = await api.get(`/jobs/${id}`); setJob(data); } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load job details');
    }
  };

  const addBox = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/boxes/', {
        job_id: id, label_reference: boxForm.label_reference,
        length_cm: +boxForm.length_cm, width_cm: +boxForm.width_cm, height_cm: +boxForm.height_cm,
        weight_kg: +boxForm.weight_kg, stop_order: +boxForm.stop_order,
        fragile: boxForm.fragile, hazard: boxForm.hazard,
      });
      setBoxForm({ label_reference: '', length_cm: '', width_cm: '', height_cm: '', weight_kg: '', stop_order: '1', fragile: false, hazard: false });
      setShowAddBox(false);
      loadJob();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add box');
    }
  };

  const updateStatus = async (newStatus: string) => {
    try { await api.put(`/jobs/${id}`, { status: newStatus }); loadJob(); } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update status');
    }
  };

  const computePacking = async () => {
    try { await api.post(`/packing/compute/${id}`); loadJob(); } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to compute packing');
    }
  };

  const generateQR = async () => {
    try { await api.post(`/qr/generate/${id}`); loadJob(); } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate QR codes');
    }
  };

  if (!job) return <div className="flex items-center justify-center py-20"><div className="animate-pulse-warm w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} /></div>;

  const statusFlow = ['draft', 'posted', 'matched', 'accepted', 'loading', 'in_transit', 'out_for_delivery', 'delivered'];
  const currentIndex = statusFlow.indexOf(job.status);

  const inputStyle = { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/jobs" className="text-sm hover:underline" style={{ color: 'var(--color-primary)' }}>← Back to Jobs</Link>
          <h1 className="text-2xl font-bold mt-2" style={{ color: 'var(--color-text)' }}>{job.job_name}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{job.date} {job.time_window && `• ${job.time_window}`}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {job.truck && job.boxes.length > 0 && (
            <>
              <button onClick={computePacking} className="px-3 py-2 rounded-xl text-xs font-medium" style={{ backgroundColor: 'var(--color-info)' + '15', color: 'var(--color-info)', border: '1px solid var(--color-info)' + '30' }}>
                🧊 Compute Packing
              </button>
              <button onClick={generateQR} className="px-3 py-2 rounded-xl text-xs font-medium" style={{ backgroundColor: 'var(--color-accent)' + '15', color: '#B0882A', border: '1px solid var(--color-accent)' + '30' }}>
                📱 Generate QR
              </button>
              <Link href={`/load-plan/${id}`} className="px-3 py-2 rounded-xl text-xs font-medium" style={{ backgroundColor: 'var(--color-secondary)' + '15', color: 'var(--color-secondary)', border: '1px solid var(--color-secondary)' + '30' }}>
                🔲 3D View
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Status timeline */}
      <div className="p-5 rounded-2xl mb-6" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {statusFlow.map((s, i) => (
            <div key={s} className="flex items-center">
              <button
                onClick={() => i === currentIndex + 1 ? updateStatus(s) : undefined}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  i <= currentIndex ? 'text-white' : i === currentIndex + 1 ? 'cursor-pointer hover:opacity-80' : 'opacity-40'
                }`}
                style={
                  i <= currentIndex ? { backgroundColor: 'var(--color-primary)' }
                  : i === currentIndex + 1 ? { backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }
                  : { backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }
                }
                disabled={i !== currentIndex + 1}
              >
                {s.replace('_', ' ')}
              </button>
              {i < statusFlow.length - 1 && <div className="w-4 h-px mx-1" style={{ backgroundColor: i < currentIndex ? 'var(--color-primary)' : 'var(--color-border)' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Truck info */}
      {job.truck && (
        <div className="p-4 rounded-2xl mb-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Assigned Truck</p>
          <p className="text-sm font-semibold mt-1" style={{ color: 'var(--color-text)' }}>
            {job.truck.truck_name} ({job.truck.plate_number}) — {job.truck.length_cm}×{job.truck.width_cm}×{job.truck.height_cm} cm, Max: {job.truck.max_weight_kg} kg
          </p>
        </div>
      )}

      {/* Boxes */}
      <div className="rounded-2xl p-5 mb-6" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>Boxes / Cargo ({job.boxes.length})</h2>
          <button onClick={() => setShowAddBox(!showAddBox)} className="px-3 py-1.5 rounded-xl text-xs font-medium" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>+ Add Box</button>
        </div>

        {showAddBox && (
          <form onSubmit={addBox} className="mb-4 p-4 rounded-xl animate-fade-in" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <input placeholder="Label" value={boxForm.label_reference} onChange={e => setBoxForm({...boxForm, label_reference: e.target.value})} required className="px-3 py-2 rounded-lg text-xs focus:outline-none" style={inputStyle} />
              <input placeholder="Length (cm)" type="number" value={boxForm.length_cm} onChange={e => setBoxForm({...boxForm, length_cm: e.target.value})} required className="px-3 py-2 rounded-lg text-xs focus:outline-none" style={inputStyle} />
              <input placeholder="Width (cm)" type="number" value={boxForm.width_cm} onChange={e => setBoxForm({...boxForm, width_cm: e.target.value})} required className="px-3 py-2 rounded-lg text-xs focus:outline-none" style={inputStyle} />
              <input placeholder="Height (cm)" type="number" value={boxForm.height_cm} onChange={e => setBoxForm({...boxForm, height_cm: e.target.value})} required className="px-3 py-2 rounded-lg text-xs focus:outline-none" style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <input placeholder="Weight (kg)" type="number" value={boxForm.weight_kg} onChange={e => setBoxForm({...boxForm, weight_kg: e.target.value})} required className="px-3 py-2 rounded-lg text-xs focus:outline-none" style={inputStyle} />
              <input placeholder="Stop #" type="number" value={boxForm.stop_order} onChange={e => setBoxForm({...boxForm, stop_order: e.target.value})} className="px-3 py-2 rounded-lg text-xs focus:outline-none" style={inputStyle} />
              <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <input type="checkbox" checked={boxForm.fragile} onChange={e => setBoxForm({...boxForm, fragile: e.target.checked})} style={{ accentColor: 'var(--color-warning)' }} /> Fragile
              </label>
              <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <input type="checkbox" checked={boxForm.hazard} onChange={e => setBoxForm({...boxForm, hazard: e.target.checked})} style={{ accentColor: 'var(--color-danger)' }} /> Hazardous
              </label>
            </div>
            <button type="submit" className="px-4 py-2 rounded-lg text-white text-xs font-medium" style={{ backgroundColor: 'var(--color-primary)' }}>Add Box</button>
          </form>
        )}

        <div className="space-y-2">
          {job.boxes.map((box: any) => (
            <div key={box.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--color-primary)' + '15', color: 'var(--color-primary)' }}>
                  {box.stop_order}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{box.label_reference}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {box.length_cm}×{box.width_cm}×{box.height_cm} cm • {box.weight_kg} kg
                    {box.fragile && ' • ⚠ Fragile'}
                    {box.hazard && ' • ☢ Hazard'}
                  </p>
                </div>
              </div>
              {box.qr_code && <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--color-secondary)' + '20', color: 'var(--color-secondary)' }}>QR ✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
