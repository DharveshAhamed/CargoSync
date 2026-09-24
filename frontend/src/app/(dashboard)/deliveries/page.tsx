'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Job, Delivery } from '@/types';

export default function DeliveriesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => { api.get('/jobs/').then(({ data }) => setJobs(data)).catch(() => { console.error("API request failed"); }); }, []);

  useEffect(() => {
    if (selectedJob) api.get(`/deliveries/job/${selectedJob}`).then(({ data }) => setDeliveries(data)).catch(() => { console.error("API request failed"); });
  }, [selectedJob]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Deliveries</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Track delivery stops and proof of delivery</p>
      </div>

      <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)}
        className="px-4 py-2.5 rounded-xl text-sm mb-6 focus:outline-none"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
        <option value="">Select a job...</option>
        {jobs.map(j => <option key={j.id} value={j.id}>{j.job_name}</option>)}
      </select>

      <div className="grid gap-4">
        {deliveries.map((d) => (
          <div key={d.id} className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                  style={{ backgroundColor: d.status === 'delivered' ? '#6B8F7120' : 'var(--color-primary)' + '15', color: d.status === 'delivered' ? 'var(--color-success)' : 'var(--color-primary)' }}>
                  #{d.stop_order}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{d.recipient_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{d.address || 'No address'}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium status-${d.status}`}>
                {d.status}
              </span>
            </div>
            {d.status === 'delivered' && d.delivered_at && (
              <div className="mt-3 pt-3 flex gap-4 text-xs" style={{ borderTop: '1px solid var(--color-border-light)', color: 'var(--color-text-muted)' }}>
                <span>Delivered: {new Date(d.delivered_at).toLocaleString()}</span>
                {d.signature_url && <span>✍ Signature</span>}
                {d.photo_url && <span>📷 Photo</span>}
                {d.gps_lat && <span>📍 GPS</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
