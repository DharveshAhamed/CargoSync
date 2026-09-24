'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { AuditLog, Job } from '@/types';

export default function AuditLogPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => { api.get('/jobs/').then(({ data }) => setJobs(data)).catch(() => { console.error("API request failed"); }); }, []);

  useEffect(() => {
    if (selectedJob) api.get(`/audit/job/${selectedJob}`).then(({ data }) => setLogs(data)).catch(() => { console.error("API request failed"); });
  }, [selectedJob]);

  const actionIcons: Record<string, string> = {
    qr_generated: '📱', loading_scanned: '📦', transit_scanned: '🚚',
    delivery_scanned: '📍', pod_submitted: '✅', tamper_detected: '⚠️',
    status_changed: '🔄', box_created: '➕',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Chain of Custody — Audit Log</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Complete tracking history for all cargo movements</p>
      </div>

      <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)}
        className="px-4 py-2.5 rounded-xl text-sm mb-6 focus:outline-none"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
        <option value="">Select a job...</option>
        {jobs.map(j => <option key={j.id} value={j.id}>{j.job_name}</option>)}
      </select>

      <div className="space-y-3">
        {logs.map((log, i) => (
          <div key={log.id} className="flex gap-4 animate-slide-in" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ backgroundColor: log.action === 'tamper_detected' ? '#C25B5620' : 'var(--color-primary)' + '15' }}>
                {actionIcons[log.action] || '📋'}
              </div>
              {i < logs.length - 1 && <div className="w-px flex-1 my-1" style={{ backgroundColor: 'var(--color-border)' }} />}
            </div>
            <div className="flex-1 pb-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border-light)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: log.action === 'tamper_detected' ? 'var(--color-danger)' : 'var(--color-text)' }}>
                    {log.action.replace(/_/g, ' ')}
                  </p>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(log.scanned_at).toLocaleString()}
                  </span>
                </div>
                {log.details && <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{log.details}</p>}
                {log.gps_lat && log.gps_lng && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>📍 {log.gps_lat.toFixed(4)}, {log.gps_lng.toFixed(4)}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {selectedJob && logs.length === 0 && (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--color-text-muted)' }}>No audit log entries yet for this job</p>
        )}
      </div>
    </div>
  );
}
