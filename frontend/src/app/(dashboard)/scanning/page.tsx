'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { Job } from '@/types';

export default function ScanningPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [manifest, setManifest] = useState<any>(null);
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanType, setScanType] = useState<'loading' | 'delivery' | 'transit'>('loading');

  useEffect(() => { api.get('/jobs/').then(({ data }) => setJobs(data)).catch(() => { console.error("API request failed"); }); }, []);

  useEffect(() => {
    if (selectedJob) loadManifest();
  }, [selectedJob]);

  const loadManifest = async () => {
    try { const { data } = await api.get(`/scanning/manifest/${selectedJob}`); setManifest(data); } catch (err: any) { console.error("Operation failed:", err.response?.data?.detail || err.message); }
  };

  const handleScan = async () => {
    if (!scanInput.trim()) return;
    try {
      const { data } = await api.post('/scanning/validate', { qr_data: scanInput, scan_type: scanType });
      setScanResult(data);
      if (selectedJob) loadManifest();
      setScanInput('');
    } catch (err: any) {
      setScanResult({ valid: false, error: err.response?.data?.detail || 'Scan failed' });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>QR Scanning</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Scan cargo QR codes for loading, delivery, and transit monitoring</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner */}
        <div className="p-6 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border-light)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Scan QR Code</h3>

          <div className="flex gap-2 mb-4">
            {(['loading', 'delivery', 'transit'] as const).map(type => (
              <button key={type} onClick={() => setScanType(type)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={scanType === type ? { backgroundColor: 'var(--color-primary)', color: 'white' } : { backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                {type}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <textarea value={scanInput} onChange={e => setScanInput(e.target.value)} rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              placeholder='Paste QR data here (e.g. {"box_id": "...", "job_id": "..."})' />
          </div>

          <button onClick={handleScan}
            className="w-full py-3 rounded-xl text-white font-medium text-sm hover:opacity-90 transition-all"
            style={{ backgroundColor: 'var(--color-primary)', boxShadow: 'var(--shadow-warm)' }}>
            Validate Scan
          </button>

          {scanResult && (
            <div className={`mt-4 p-4 rounded-xl text-sm animate-fade-in`}
              style={{ backgroundColor: scanResult.valid ? '#6B8F7115' : '#C25B5615', border: `1px solid ${scanResult.valid ? '#6B8F7130' : '#C25B5630'}`, color: scanResult.valid ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {scanResult.valid ? (
                <div>
                  <p className="font-medium">✓ {scanResult.message}</p>
                  {scanResult.recipient && <p className="text-xs mt-1">Recipient: {scanResult.recipient}</p>}
                </div>
              ) : (
                <p>✗ {scanResult.error || 'Validation failed'}</p>
              )}
            </div>
          )}
        </div>

        {/* Manifest */}
        <div className="p-6 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border-light)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Loading Manifest</h3>

          <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm mb-4 focus:outline-none"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
            <option value="">Select a job...</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.job_name}</option>)}
          </select>

          {manifest && (
            <>
              <div className="flex items-center justify-between mb-4 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-surface)' }}>
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Scanned: {manifest.scanned_boxes}/{manifest.total_boxes}</span>
                {manifest.all_scanned ? (
                  <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: '#6B8F7120', color: 'var(--color-success)' }}>✓ Complete</span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: '#D4A85320', color: '#B0882A' }}>In Progress</span>
                )}
              </div>
              <div className="space-y-2">
                {manifest.manifest.map((item: any) => (
                  <div key={item.box_id} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ backgroundColor: item.scanned ? '#6B8F7108' : 'var(--color-surface)', border: item.scanned ? '1px solid #6B8F7120' : '1px solid transparent' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                        style={{ backgroundColor: item.scanned ? 'var(--color-success)' : 'var(--color-border)', color: item.scanned ? 'white' : 'var(--color-text-muted)' }}>
                        {item.scanned ? '✓' : item.stop_order}
                      </div>
                      <span className="text-sm" style={{ color: 'var(--color-text)' }}>{item.label}</span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{item.weight_kg} kg</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
