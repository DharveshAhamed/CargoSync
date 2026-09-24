'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Job } from '@/types';

export default function CargoPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [boxes, setBoxes] = useState<any[]>([]);

  useEffect(() => { api.get('/jobs/').then(({ data }) => setJobs(data)).catch(() => { console.error("API request failed"); }); }, []);

  useEffect(() => {
    if (selectedJob) {
      api.get(`/boxes/job/${selectedJob}`).then(({ data }) => setBoxes(data)).catch(() => { console.error("API request failed"); });
    }
  }, [selectedJob]);

  const totalWeight = boxes.reduce((sum, b) => sum + b.weight_kg, 0);
  const totalVolume = boxes.reduce((sum, b) => sum + (b.length_cm * b.width_cm * b.height_cm) / 1000000, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Cargo Management</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>View and manage cargo across all jobs</p>
      </div>

      <div className="mb-6">
        <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
          <option value="">Select a job...</option>
          {jobs.map(j => <option key={j.id} value={j.id}>{j.job_name} ({j.date})</option>)}
        </select>
      </div>

      {selectedJob && boxes.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Total Boxes</p>
              <p className="text-xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{boxes.length}</p>
            </div>
            <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Total Weight</p>
              <p className="text-xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{totalWeight.toFixed(1)} kg</p>
            </div>
            <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Total Volume</p>
              <p className="text-xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{totalVolume.toFixed(2)} m³</p>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                  <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--color-text-secondary)' }}>Label</th>
                  <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--color-text-secondary)' }}>Dimensions (cm)</th>
                  <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--color-text-secondary)' }}>Weight</th>
                  <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--color-text-secondary)' }}>Stop</th>
                  <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--color-text-secondary)' }}>Flags</th>
                </tr>
              </thead>
              <tbody>
                {boxes.map((box: any) => (
                  <tr key={box.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{box.label_reference}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{box.length_cm} × {box.width_cm} × {box.height_cm}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{box.weight_kg} kg</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--color-primary)' + '15', color: 'var(--color-primary)' }}>#{box.stop_order}</span></td>
                    <td className="px-4 py-3 text-xs">
                      {box.fragile && <span className="mr-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: '#D4A85320', color: '#B0882A' }}>⚠ Fragile</span>}
                      {box.hazard && <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: '#C25B5620', color: 'var(--color-danger)' }}>☢ Hazard</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
