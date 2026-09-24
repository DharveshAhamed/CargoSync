'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { Job } from '@/types';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    setPageLoading(true);
    try {
      const { data } = await api.get('/jobs/');
      setJobs(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load jobs');
    } finally {
      setPageLoading(false);
    }
  };
  const filtered = filter ? jobs.filter(j => j.status === filter) : jobs;

  const statusColors: Record<string, string> = {
    draft: 'status-draft', posted: 'status-posted', matched: 'status-matched',
    accepted: 'status-accepted', loading: 'status-loading', in_transit: 'status-in_transit',
    out_for_delivery: 'status-out_for_delivery', delivered: 'status-delivered',
  };

  const statuses = ['', 'draft', 'posted', 'matched', 'accepted', 'loading', 'in_transit', 'out_for_delivery', 'delivered'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Job Management</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Create and manage freight jobs</p>
        </div>
        <Link href="/jobs/new" className="px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-all" style={{ backgroundColor: 'var(--color-primary)', boxShadow: 'var(--shadow-warm)' }}>
          + New Job
        </Link>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm flex items-center justify-between" style={{ backgroundColor: '#C25B5615', color: 'var(--color-danger)', border: '1px solid #C25B5630' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-4 font-bold hover:opacity-70">×</button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {statuses.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filter === s ? 'text-white' : ''}`}
            style={filter === s ? { backgroundColor: 'var(--color-primary)', color: 'white' } : { backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      {/* Job list */}
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border-light)' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>No jobs found</p>
          </div>
        ) : (
          filtered.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}
              className="p-5 rounded-2xl flex items-center justify-between gap-4 transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{job.job_name}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {job.date} {job.time_window && `• ${job.time_window}`} • {job.box_count || 0} boxes • {job.delivery_count || 0} stops
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[job.status] || ''}`}>
                {job.status.replace('_', ' ')}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
