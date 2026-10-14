'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import dynamic from 'next/dynamic';
import type { PackingResult, BoxPlacement } from '@/types';

const ThreeScene = dynamic(() => import('@/components/three/LoadPlanViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      <span className="text-xs">Loading 3D Engine...</span>
    </div>
  ),
});

export default function LoadPlanPage() {
  const { jobId } = useParams();
  const [packingData, setPackingData] = useState<PackingResult | null>(null);
  const [jobName, setJobName] = useState('');
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [selectedBox, setSelectedBox] = useState<BoxPlacement | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (jobId) loadData();
  }, [jobId]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/jobs/${jobId}`);
      setJobName(data.job_name);
      if (data.packing_data) {
        setPackingData(JSON.parse(data.packing_data));
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleComputePacking = async () => {
    setComputing(true);
    setError('');
    try {
      const { data } = await api.post(`/packing/compute/${jobId}`);
      setPackingData(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to compute packing');
    } finally {
      setComputing(false);
    }
  };

  const handleDownloadSheet = async () => {
    try {
      const res = await api.get(`/packing/loading-sheet/${jobId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `loading_sheet_${jobName || jobId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to download loading sheet');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link href={`/jobs/${jobId}`} className="text-sm hover:underline" style={{ color: 'var(--color-primary)' }}>
            ← Back to Job
          </Link>
          <h1 className="text-2xl font-bold mt-2" style={{ color: 'var(--color-text)' }}>
            3D Load Plan — {jobName || 'Cargo Sync'}
          </h1>
        </div>

        <div className="flex gap-2 flex-wrap">
          {packingData && (
            <>
              <button
                onClick={handleComputePacking}
                disabled={computing}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                style={{
                  backgroundColor: 'var(--color-info)' + '15',
                  color: 'var(--color-info)',
                  border: '1px solid var(--color-info)' + '35',
                }}
              >
                {computing ? 'Recalculating...' : '🔄 Recompute'}
              </button>
              <button
                onClick={handleDownloadSheet}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                }}
              >
                📄 Loading Sheet PDF
              </button>
              <Link
                href={`/jobs/${jobId}`}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                style={{
                  backgroundColor: 'rgba(217, 119, 6, 0.15)',
                  color: '#d97706',
                  border: '1px solid rgba(217, 119, 6, 0.35)',
                }}
              >
                📋 Driver Checklist
              </Link>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl mb-6 bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full animate-spin border-2 border-amber-600 border-t-transparent" />
        </div>
      ) : packingData ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 3D Scene */}
          <div
            className="lg:col-span-3 rounded-2xl overflow-hidden shadow-2xl relative"
            style={{ backgroundColor: '#131325', height: '620px', border: '1px solid var(--color-border-light)' }}
          >
            <ThreeScene packingData={packingData} onSelectBox={setSelectedBox} />
          </div>

          {/* Stats & Sequence Panel */}
          <div className="space-y-4">
            <div
              className="p-4 rounded-2xl"
              style={{
                backgroundColor: 'var(--color-card)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border-light)',
              }}
            >
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Space Efficiency
              </p>
              <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-primary)' }}>
                {packingData.efficiency}%
              </p>
              <div className="w-full h-2 rounded-full mt-2" style={{ backgroundColor: 'var(--color-border)' }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(packingData.efficiency, 100)}%`, backgroundColor: 'var(--color-primary)' }}
                />
              </div>
            </div>

            <div
              className="p-4 rounded-2xl"
              style={{
                backgroundColor: 'var(--color-card)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border-light)',
              }}
            >
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Weight Used
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
                {packingData.total_weight} kg
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {packingData.weight_capacity_used}% capacity used
              </p>
            </div>

            <div
              className="p-4 rounded-2xl"
              style={{
                backgroundColor: 'var(--color-card)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border-light)',
              }}
            >
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Packed Cargo Placements
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-success)' }}>
                {packingData.placements.length} boxes packed
              </p>
              {packingData.unpacked.length > 0 && (
                <p className="text-xs mt-1 text-red-500 font-medium">
                  ⚠ {packingData.unpacked.length} could not fit in truck
                </p>
              )}
            </div>

            {/* Boxes list */}
            <div
              className="p-4 rounded-2xl"
              style={{
                backgroundColor: 'var(--color-card)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border-light)',
              }}
            >
              <p className="text-xs font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                Cargo Sequence & Placements
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {packingData.placements.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    onClick={() => setSelectedBox(p)}
                    className={`p-2.5 rounded-xl text-xs cursor-pointer transition-all border ${
                      selectedBox?.id === p.id
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                        {p.label}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{
                          backgroundColor:
                            p.stop_order === 1
                              ? '#C17B4A25'
                              : p.stop_order === 2
                              ? '#6B8F7125'
                              : '#6B8FB825',
                          color:
                            p.stop_order === 1
                              ? '#C17B4A'
                              : p.stop_order === 2
                              ? '#6B8F71'
                              : '#6B8FB8',
                        }}
                      >
                        Stop {p.stop_order}
                      </span>
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {p.length}×{p.width}×{p.height} cm • Pos ({p.x}, {p.y}, {p.z})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="text-center py-20 px-4 rounded-2xl max-w-xl mx-auto"
          style={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border-light)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="text-4xl mb-3">🧊</div>
          <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            No 3D Packing Plan Yet
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            Compute 3D optimal cargo placement according to reverse delivery order and truck dimensions.
          </p>
          <button
            onClick={handleComputePacking}
            disabled={computing}
            className="px-6 py-3 rounded-xl font-medium text-sm text-white shadow-lg transition-all hover:opacity-90 flex items-center justify-center gap-2 mx-auto"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {computing ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Computing 3D Packing...
              </>
            ) : (
              '🧊 Compute 3D Packing Plan'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
