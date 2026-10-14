'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import type { Job, User } from '@/types';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getUser());
    loadJobs();
  }, []);

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

  const statuses = ['', 'posted', 'accepted', 'loading', 'in_transit', 'out_for_delivery', 'delivered'];
  const isTrucker = user?.user_type === 'trucker';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {isTrucker ? 'Trucker Freight & Jobs' : 'Job Management'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {isTrucker 
              ? 'Browse open jobs to accept, compute 3D container packing, and execute trips' 
              : 'Create and manage freight cargo jobs'}
          </p>
        </div>
        {!isTrucker && (
          <Link href="/jobs/new" className="px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-all" style={{ backgroundColor: 'var(--color-primary)', boxShadow: 'var(--shadow-warm)' }}>
            + New Job
          </Link>
        )}
      </div>

      {isTrucker && (
        <div className="mb-6 p-4 rounded-2xl flex items-center justify-between gap-4" style={{ backgroundColor: '#1A365D15', border: '1px solid #2B6CB040' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚛</span>
            <div>
              <p className="text-sm font-semibold text-blue-900">Trucker Workflow Active</p>
              <p className="text-xs text-blue-700">1. Accept available jobs ➔ 2. Pack boxes in 3D (multi-job placement) ➔ 3. Start Trip ➔ 4. End Trip at destination</p>
            </div>
          </div>
          <button 
            onClick={() => setFilter('posted')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Find Available Jobs
          </button>
        </div>
      )}

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
            {s ? (s === 'posted' ? 'Available (Posted)' : s.replace('_', ' ')) : 'All Jobs'}
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
                  Pickup: {job.date} {job.time_window && `• Delivery: ${job.time_window}`} • {job.box_count || 0} boxes • {job.delivery_count || 0} stops
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isTrucker && job.status === 'posted' && (
                  <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    🤝 Accept & Pack
                  </span>
                )}
                {isTrucker && job.status === 'accepted' && (
                  <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                    📦 Needs 3D Packing
                  </span>
                )}
                {isTrucker && job.status === 'loading' && (
                  <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    🚀 Ready for Trip
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[job.status] || ''}`}>
                  {job.status.replace('_', ' ')}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
