'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/auth';
import api from '@/lib/api';
import Link from 'next/link';

interface Stats {
  trucks: number;
  jobs: number;
  active_jobs: number;
  delivered: number;
}

export default function DashboardPage() {
  const user = getUser();
  const [stats, setStats] = useState<Stats>({ trucks: 0, jobs: 0, active_jobs: 0, delivered: 0 });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [trucksRes, jobsRes] = await Promise.all([
        api.get('/trucks/'),
        api.get('/jobs/'),
      ]);
      const jobs = jobsRes.data;
      setStats({
        trucks: trucksRes.data.length,
        jobs: jobs.length,
        active_jobs: jobs.filter((j: any) => ['in_transit', 'loading', 'out_for_delivery'].includes(j.status)).length,
        delivered: jobs.filter((j: any) => j.status === 'delivered').length,
      });
      setRecentJobs(jobs.slice(0, 5));
    } catch {
      // API not connected yet
    }
  };

  const statCards = [
    { label: 'Total Trucks', value: stats.trucks, color: 'var(--color-primary)', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z' },
    { label: 'Total Jobs', value: stats.jobs, color: 'var(--color-info)', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Active Jobs', value: stats.active_jobs, color: 'var(--color-accent)', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { label: 'Delivered', value: stats.delivered, color: 'var(--color-success)', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  const statusColors: Record<string, string> = {
    draft: 'status-draft', posted: 'status-posted', matched: 'status-matched',
    accepted: 'status-accepted', loading: 'status-loading', in_transit: 'status-in_transit',
    out_for_delivery: 'status-out_for_delivery', delivered: 'status-delivered',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Here&apos;s an overview of your fleet operations
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="p-5 rounded-2xl transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.color + '15' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stat.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {[
          { href: '/jobs/new', label: 'Create New Job', desc: 'Start a new freight job', color: 'var(--color-primary)' },
          { href: '/trucks', label: 'Manage Fleet', desc: 'Add or edit trucks', color: 'var(--color-secondary)' },
          { href: '/scanning', label: 'Scan Cargo', desc: 'Scan QR codes', color: 'var(--color-accent)' },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="p-5 rounded-2xl flex items-center gap-4 transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: action.color + '15' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={action.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{action.label}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent jobs */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>Recent Jobs</h2>
          <Link href="/jobs" className="text-sm font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>View all →</Link>
        </div>
        {recentJobs.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
            No jobs yet. <Link href="/jobs/new" className="font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>Create your first job</Link>
          </p>
        ) : (
          <div className="space-y-3">
            {recentJobs.map((job: any) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:opacity-80 transition-all"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{job.job_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{job.date} • {job.box_count || 0} boxes</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[job.status] || ''}`}>
                  {job.status.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
