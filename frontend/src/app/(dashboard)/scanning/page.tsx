'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { Job } from '@/types';
import { getUser } from '@/lib/auth';

interface ChecklistBox {
  id: string;
  label_reference: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  weight_kg: number;
  stop_order: number;
  fragile: boolean;
  hazard: boolean;
  pack_x?: number;
  pack_y?: number;
  pack_z?: number;
  recipient_name?: string;
  delivery_address?: string;
  checked: boolean;
}

interface ChecklistData {
  job_id: string;
  job_name: string;
  status: string;
  truck?: {
    name: string;
    plate_number: string;
    dimensions: string;
    max_weight_kg: number;
  };
  total_boxes: number;
  checked_boxes: number;
  default_safety_checks: string[];
  approval?: {
    approved: boolean;
    stage?: string;
    approved_by: string;
    approved_at: string;
    notes?: string;
    safety_checks?: string[];
    checked_count: number;
    total_count: number;
  } | null;
  boxes: ChecklistBox[];
  recent_events?: {
    id: string;
    action: string;
    label: string;
    timestamp: string;
  }[];
}

const STAGE_CONFIGS: Record<
  string,
  { label: string; title: string; subtitle: string; icon: string; defaultChecks: string[] }
> = {
  delivery: {
    label: 'Unload & Delivery',
    title: 'Unload & Delivery Checklist',
    subtitle: 'Verify cargo condition at delivery stop, confirm recipient handoff, and record proof of custody.',
    icon: '🚚',
    defaultChecks: [
      'Package exterior inspected for damage, leaks, or tampering',
      'Box label and stop order verified against delivery manifest',
      'Delivered package count matches recipient order',
      'Customer/recipient acknowledgment and handoff confirmed',
    ],
  },
  loading: {
    label: 'Pre-Trip Loading',
    title: 'Cargo Loading & Staging Checklist',
    subtitle: 'Verify cargo loaded into the truck container according to 3D packing plan and safety protocols.',
    icon: '📦',
    defaultChecks: [
      'Cargo placed according to 3D packing sequence & reverse stop order',
      'Weight distributed evenly across truck axles within max capacity',
      'Fragile items secured on top layer without heavy overhead weight',
      'Hazardous cargo isolated, strapped, and properly labeled',
      'Load locks, tie-down straps, or cargo nets firmly fastened',
      'Container seal inspected and vehicle pre-trip check complete',
    ],
  },
  transit: {
    label: 'In-Transit Check',
    title: 'In-Transit Cargo Integrity Checklist',
    subtitle: 'Perform en-route inspections to ensure load stability, seal integrity, and cargo security.',
    icon: '🛣',
    defaultChecks: [
      'Truck rear seal and locks verified intact',
      'Cargo straps inspected for tension after initial transit',
      'No shifting or tilt detected inside cargo hold',
      'Reefer / temperature within required bounds (if applicable)',
    ],
  },
};

export default function ScanningPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [checklist, setChecklist] = useState<ChecklistData | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'delivery' | 'loading' | 'transit'>('delivery');

  // Form & Interaction state
  const [checkedBoxIds, setCheckedBoxIds] = useState<Set<string>>(new Set());
  const [selectedSafetyChecks, setSelectedSafetyChecks] = useState<Set<string>>(new Set());
  const [driverName, setDriverName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const currentUser = getUser();
  const isTrucker = currentUser?.user_type === 'trucker';

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      loadChecklist(selectedJob);
    } else {
      setChecklist(null);
      setCheckedBoxIds(new Set());
    }
  }, [selectedJob, stage]);

  const loadJobs = async () => {
    try {
      const { data } = await api.get('/jobs/');
      setJobs(data);
      if (data.length > 0 && !selectedJob) {
        setSelectedJob(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load jobs list', err);
    }
  };

  const loadChecklist = async (jobId: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const { data } = await api.get(`/checklist/${jobId}?stage=${stage}`);
      setChecklist(data);

      const checked = new Set<string>();
      data.boxes.forEach((b: ChecklistBox) => {
        if (b.checked) checked.add(b.id);
      });
      setCheckedBoxIds(checked);

      const cfg = STAGE_CONFIGS[stage];
      if (data.approval?.safety_checks && data.approval.safety_checks.length > 0) {
        setSelectedSafetyChecks(new Set(data.approval.safety_checks));
      } else {
        setSelectedSafetyChecks(new Set(cfg.defaultChecks));
      }

      setDriverName(data.approval?.approved_by || currentUser?.name || '');
      setNotes(data.approval?.notes || '');
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to load cargo checklist',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBox = async (boxId: string) => {
    const nextState = !checkedBoxIds.has(boxId);
    setCheckedBoxIds((prev) => {
      const next = new Set(prev);
      if (next.has(boxId)) next.delete(boxId);
      else next.add(boxId);
      return next;
    });

    try {
      await api.post('/checklist/toggle-box', {
        job_id: selectedJob,
        box_id: boxId,
        stage: stage,
        checked: nextState,
        driver_name: driverName || currentUser?.name || 'Driver',
      });
      // Soft reload checklist in background to refresh activity log
      api.get(`/checklist/${selectedJob}?stage=${stage}`).then(({ data }) => setChecklist(data));
    } catch {
      // Revert if API fails
      setCheckedBoxIds((prev) => {
        const next = new Set(prev);
        if (nextState) next.delete(boxId);
        else next.add(boxId);
        return next;
      });
    }
  };

  const handleToggleAll = () => {
    if (!checklist) return;
    const allChecked = checkedBoxIds.size === checklist.boxes.length;
    if (allChecked) {
      setCheckedBoxIds(new Set());
    } else {
      setCheckedBoxIds(new Set(checklist.boxes.map((b) => b.id)));
    }
  };

  const handleToggleSafetyCheck = (item: string) => {
    setSelectedSafetyChecks((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const handleSubmitApproval = async () => {
    if (!driverName.trim()) {
      setFeedback({ type: 'error', message: 'Driver / Inspector name is required.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const { data } = await api.post(`/checklist/approve/${selectedJob}`, {
        driver_name: driverName.trim(),
        stage: stage,
        checked_box_ids: Array.from(checkedBoxIds),
        safety_checks: Array.from(selectedSafetyChecks),
        notes: notes.trim() || undefined,
        advance_status: true,
      });

      setFeedback({
        type: 'success',
        message: data.message || `✓ Checklist successfully approved for ${STAGE_CONFIGS[stage].label}!`,
      });
      loadChecklist(selectedJob);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to submit checklist approval',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStageConfig = STAGE_CONFIGS[stage];
  const totalBoxes = checklist?.boxes.length || 0;
  const checkedBoxesCount = checkedBoxIds.size;
  const progressPercent = totalBoxes > 0 ? Math.round((checkedBoxesCount / totalBoxes) * 100) : 0;
  const isApproved = checklist?.approval?.approved;

  const inputStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
  };

  return (
    <div>
      {/* Page Title & Stage Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activeStageConfig.icon}</span>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              {activeStageConfig.title}
            </h1>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {activeStageConfig.subtitle}
          </p>
        </div>

        {/* Stage Tabs */}
        <div
          className="flex p-1 rounded-2xl gap-1 self-start md:self-auto border"
          style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border-light)' }}
        >
          {(['delivery', 'loading', 'transit'] as const).map((s) => {
            const isActive = stage === s;
            const cfg = STAGE_CONFIGS[s];
            return (
              <button
                key={s}
                onClick={() => setStage(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive ? 'shadow-sm text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
                style={isActive ? { backgroundColor: 'var(--color-primary)' } : undefined}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      {feedback && (
        <div
          className={`p-4 rounded-xl mb-6 text-sm flex items-center justify-between border animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-500'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold px-2">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Checklist & Sign-off Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Cargo Checklist (2 cols) */}
        <div
          className="lg:col-span-2 p-6 rounded-2xl flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-card)',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--color-border-light)',
          }}
        >
          <div>
            {/* Job Selector Dropdown */}
            <div className="mb-5">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Select Active Job
              </label>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition-all"
                style={inputStyle}
              >
                <option value="">Select a cargo job...</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.job_name} ({j.status}) — {j.date}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
                <span className="text-xs text-gray-400">Loading Cargo Checklist...</span>
              </div>
            ) : checklist ? (
              <>
                {/* Progress Meter Bar */}
                <div className="p-4 rounded-xl mb-5 bg-slate-500/10 border border-slate-500/20">
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span style={{ color: 'var(--color-text)' }}>Manifest Verification</span>
                    <span className={checkedBoxesCount === totalBoxes ? 'text-emerald-600 font-bold' : ''}>
                      {checkedBoxesCount} / {totalBoxes} Packages Checked ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: checkedBoxesCount === totalBoxes ? '#16a34a' : 'var(--color-primary)',
                      }}
                    />
                  </div>
                </div>

                {/* Section Header & Toggle All */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                    Cargo Packages ({checklist.boxes.length})
                  </h3>
                  <button
                    onClick={handleToggleAll}
                    type="button"
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {checkedBoxesCount === totalBoxes ? 'Deselect All' : 'Select / Verify All'}
                  </button>
                </div>

                {/* Checklist Boxes */}
                <div className="space-y-2.5">
                  {checklist.boxes.map((box) => {
                    const isChecked = checkedBoxIds.has(box.id);

                    return (
                      <div
                        key={box.id}
                        onClick={() => handleToggleBox(box.id)}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                          isChecked
                            ? 'border-emerald-500/40 bg-emerald-500/5'
                            : 'border-gray-200 dark:border-gray-800 hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Handled by container click
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 pointer-events-none"
                            style={{ accentColor: '#16a34a' }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                {box.label_reference}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600">
                                Stop #{box.stop_order}
                              </span>
                              {box.fragile && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600">
                                  ⚠ Fragile
                                </span>
                              )}
                              {box.hazard && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-600">
                                  ☢ Hazard
                                </span>
                              )}
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                              {box.length_cm}×{box.width_cm}×{box.height_cm} cm • {box.weight_kg} kg
                              {box.pack_x !== null && box.pack_x !== undefined && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                  {' '}
                                  • 3D Placement: ({box.pack_x}, {box.pack_y}, {box.pack_z}) cm
                                </span>
                              )}
                            </p>
                            {box.recipient_name && (
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                Recipient: <strong className="text-gray-700 dark:text-gray-300">{box.recipient_name}</strong>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isChecked ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
                              <span>✓</span>
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/15 text-gray-500 border border-gray-400/20">
                              Tap to Verify
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-sm text-gray-400">
                Please select a job above to view the cargo inspection checklist.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Driver Sign-off & 3D Packing Cross-Reference (1 col) */}
        <div className="space-y-6">
          {/* Driver Approval & Sign-Off Card */}
          <div
            className="p-6 rounded-2xl"
            style={{
              backgroundColor: 'var(--color-card)',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--color-border-light)',
            }}
          >
            <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <span>✍</span>
              <span>Driver Sign-Off & Inspection</span>
            </h3>

            {/* Existing approval note */}
            {isApproved && (
              <div className="p-3.5 rounded-xl mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <span>✓</span>
                  <span>Approved by {checklist?.approval?.approved_by}</span>
                </p>
                <p className="text-[11px] text-gray-600 dark:text-gray-400">
                  {checklist?.approval?.approved_at && new Date(checklist.approval.approved_at).toLocaleString()} •{' '}
                  {checklist?.approval?.checked_count}/{checklist?.approval?.total_count} items checked
                </p>
              </div>
            )}

            {/* Safety & Protocol Items */}
            <div className="space-y-2 mb-4">
              <label className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                Inspection Protocol Checks
              </label>
              {activeStageConfig.defaultChecks.map((item) => {
                const checked = selectedSafetyChecks.has(item);

                return (
                  <label
                    key={item}
                    className="flex items-start gap-2.5 p-2 rounded-xl border border-gray-200 dark:border-gray-800 text-xs cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleSafetyCheck(item)}
                      className="mt-0.5 w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span className={checked ? 'text-gray-900 dark:text-gray-200 font-medium' : 'text-gray-500'}>
                      {item}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Driver Name input */}
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Driver / Inspector Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Anees"
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                style={inputStyle}
              />
            </div>

            {/* Notes textarea */}
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Inspection Notes / Proof of Delivery
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. All 3 boxes verified in good condition, seal #8812 verified."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none resize-none"
                style={inputStyle}
              />
            </div>

            {/* Approval Button */}
            <button
              onClick={handleSubmitApproval}
              disabled={isSubmitting || !driverName.trim() || !selectedJob}
              className="w-full py-3 rounded-xl text-white font-bold text-xs shadow-md transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#16a34a' }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Submitting Sign-Off...
                </>
              ) : (
                `✓ Approve & Sign Off ${activeStageConfig.label}`
              )}
            </button>
          </div>

          {/* 3D Packing Cross-Reference Card */}
          {checklist?.truck && (
            <div
              className="p-5 rounded-2xl"
              style={{
                backgroundColor: 'var(--color-card)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border-light)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🧊</span>
                <h4 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                  3D Load Plan Cross-Reference
                </h4>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Assigned Truck: <strong className="text-gray-800 dark:text-gray-200">{checklist.truck.name}</strong> ({checklist.truck.plate_number}) — {checklist.truck.dimensions}
              </p>
              <Link
                href={`/load-plan/${selectedJob}`}
                className="block text-center py-2 px-3 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Open 3D Load Plan Viewer →
              </Link>
            </div>
          )}

          {/* Recent Verification Activity */}
          {checklist?.recent_events && checklist.recent_events.length > 0 && (
            <div
              className="p-5 rounded-2xl"
              style={{
                backgroundColor: 'var(--color-card)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border-light)',
              }}
            >
              <h4 className="font-semibold text-xs mb-3 text-gray-500 uppercase tracking-wider">
                Recent Verification Events
              </h4>
              <div className="space-y-2">
                {checklist.recent_events.map((ev) => (
                  <div key={ev.id} className="text-xs p-2 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200 capitalize">
                        {ev.action.replaceAll('_', ' ')}
                      </p>
                      {ev.label && <p className="text-[11px] text-gray-500">{ev.label}</p>}
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
