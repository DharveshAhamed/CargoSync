'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import dynamic from 'next/dynamic';
import type { PackingResult } from '@/types';

const ThreeScene = dynamic(() => import('@/components/three/LoadPlanViewer'), { ssr: false });

export default function LoadPlanPage() {
  const { jobId } = useParams();
  const [packingData, setPackingData] = useState<PackingResult | null>(null);
  const [jobName, setJobName] = useState('');

  useEffect(() => { if (jobId) loadData(); }, [jobId]);

  const loadData = async () => {
    try {
      const { data } = await api.get(`/jobs/${jobId}`);
      setJobName(data.job_name);
      if (data.packing_data) {
        setPackingData(JSON.parse(data.packing_data));
      }
    } catch (err: any) { console.error("Operation failed:", err.response?.data?.detail || err.message); }
  };

  return (
    <div>
      <div className="mb-6">
        <Link href={`/jobs/${jobId}`} className="text-sm hover:underline" style={{ color: 'var(--color-primary)' }}>← Back to Job</Link>
        <h1 className="text-2xl font-bold mt-2" style={{ color: 'var(--color-text)' }}>3D Load Plan — {jobName}</h1>
      </div>

      {packingData ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 3D Viewer */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden" style={{ backgroundColor: '#1a1a2e', height: '600px', boxShadow: 'var(--shadow-lg)' }}>
            <ThreeScene packingData={packingData} />
          </div>

          {/* Stats panel */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Space Efficiency</p>
              <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-primary)' }}>{packingData.efficiency}%</p>
              <div className="w-full h-2 rounded-full mt-2" style={{ backgroundColor: 'var(--color-border)' }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${packingData.efficiency}%`, backgroundColor: 'var(--color-primary)' }} />
              </div>
            </div>
            <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Weight Used</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{packingData.total_weight} kg</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{packingData.weight_capacity_used}% capacity</p>
            </div>
            <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Packed Boxes</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-success)' }}>{packingData.placements.length}</p>
              {packingData.unpacked.length > 0 && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{packingData.unpacked.length} could not fit</p>
              )}
            </div>
            <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Legend</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ backgroundColor: '#C17B4A' }} /> Stop 1 (Last loaded)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ backgroundColor: '#6B8F71' }} /> Stop 2</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ backgroundColor: '#6B8FB8' }} /> Stop 3</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ backgroundColor: '#D4A853' }} /> Stop 4+</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border-light)' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>No packing data yet. Go to the job detail page and click &quot;Compute Packing&quot; first.</p>
        </div>
      )}
    </div>
  );
}
