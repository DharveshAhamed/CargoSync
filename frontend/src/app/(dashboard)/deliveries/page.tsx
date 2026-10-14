'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import type { Job, JobDetail, Delivery, User } from '@/types';

export default function DeliveriesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [currentJob, setCurrentJob] = useState<JobDetail | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [user, setUser] = useState<User | null>(null);

  // Delivery Verification Checklist Modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [checkedBoxIds, setCheckedBoxIds] = useState<Set<string>>(new Set());
  const [qualityChecks, setQualityChecks] = useState<Set<string>>(new Set([
    'intact_packaging',
    'count_verified',
    'no_transit_damage',
    'receiver_handover',
  ]));
  const [recipientName, setRecipientName] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);

  useEffect(() => {
    setUser(getUser());
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadJobDetails(selectedJobId);
      loadDeliveries(selectedJobId);
    } else {
      setCurrentJob(null);
      setDeliveries([]);
    }
  }, [selectedJobId]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/jobs/');
      setJobs(data);
      if (data.length > 0 && !selectedJobId) {
        setSelectedJobId(data[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadJobDetails = async (jobId: string) => {
    try {
      const { data } = await api.get(`/jobs/${jobId}`);
      setCurrentJob(data);
      // Pre-fill recipient name if available
      if (!recipientName && data.company) {
        setRecipientName(data.company.company_name || 'Consignee Receiving');
      }
    } catch {
      // Handled silently
    }
  };

  const loadDeliveries = async (jobId: string) => {
    try {
      const { data } = await api.get(`/deliveries/job/${jobId}`);
      setDeliveries(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load delivery stops');
    }
  };

  const toggleBox = (boxId: string) => {
    const next = new Set(checkedBoxIds);
    if (next.has(boxId)) next.delete(boxId);
    else next.add(boxId);
    setCheckedBoxIds(next);
  };

  const selectAllBoxes = () => {
    if (!currentJob?.boxes) return;
    if (checkedBoxIds.size === currentJob.boxes.length) {
      setCheckedBoxIds(new Set());
    } else {
      setCheckedBoxIds(new Set(currentJob.boxes.map((b: any) => b.id)));
    }
  };

  const toggleQualityCheck = (key: string) => {
    const next = new Set(qualityChecks);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setQualityChecks(next);
  };

  const handleCompleteDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) return;

    if (currentJob?.boxes && currentJob.boxes.length > 0 && checkedBoxIds.size < currentJob.boxes.length) {
      setError(`Please check and verify all ${currentJob.boxes.length} cargo boxes before ending the trip.`);
      return;
    }

    setIsSubmittingDelivery(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        recipient_name: recipientName.trim() || 'Consignee Receiving',
        notes: deliveryNotes.trim() || 'All boxes inspected, unloaded and verified intact.',
        verified_box_ids: Array.from(checkedBoxIds),
        condition_verified: true,
      };

      const { data } = await api.post(`/jobs/${selectedJobId}/end-trip`, payload);
      setSuccessMsg(data.message || 'Delivery completed successfully! Company has been notified.');
      setShowVerifyModal(false);
      loadJobDetails(selectedJobId);
      loadDeliveries(selectedJobId);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to complete delivery');
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  const isTrucker = user?.user_type === 'trucker' || user?.user_type === 'admin';
  const isCompany = user?.user_type === 'company';
  const canEndTrip = isTrucker && currentJob && (currentJob.status === 'in_transit' || currentJob.status === 'out_for_delivery');
  const isDelivered = currentJob?.status === 'delivered';

  const statusColors: Record<string, string> = {
    draft: 'status-draft', posted: 'status-posted', matched: 'status-matched',
    accepted: 'status-accepted', loading: 'status-loading', in_transit: 'status-in_transit',
    out_for_delivery: 'status-out_for_delivery', delivered: 'status-delivered',
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Deliveries & Proof of Delivery</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Track destination stops, driver load verification, and live delivery status
          </p>
        </div>
        {currentJob && (
          <Link
            href={`/jobs/${currentJob.id}`}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          >
            <span>📄</span>
            <span>View Full Job #{currentJob.id.slice(0, 8)}</span>
          </Link>
        )}
      </div>

      {/* Error & Success Banners */}
      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm flex items-center justify-between" style={{ backgroundColor: '#C25B5615', color: 'var(--color-danger)', border: '1px solid #C25B5630' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-4 font-bold hover:opacity-70">×</button>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl text-sm flex items-center justify-between" style={{ backgroundColor: '#6B8F7115', color: 'var(--color-success)', border: '1px solid #6B8F7130' }}>
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="ml-4 font-bold hover:opacity-70">×</button>
        </div>
      )}

      {/* Select Job Bar */}
      <div
        className="p-4 rounded-2xl mb-6 flex items-center justify-between gap-4 flex-wrap"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <span className="text-xl">📦</span>
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Select Active Shipment
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm font-semibold focus:outline-none"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            >
              <option value="">Choose a job to inspect...</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.job_name} ({j.status.replace('_', ' ')}) • {j.date}
                </option>
              ))}
            </select>
          </div>
        </div>

        {canEndTrip && (
          <button
            onClick={() => {
              if (currentJob?.boxes) {
                setCheckedBoxIds(new Set(currentJob.boxes.map((b: any) => b.id)));
              }
              setShowVerifyModal(true);
            }}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md flex items-center gap-2 hover:opacity-95 transition-all animate-bounce"
            style={{ backgroundColor: '#10B981' }}
          >
            <span>🏁</span>
            <span>Verify Load & Complete Delivery</span>
          </button>
        )}
      </div>

      {loading && (
        <div className="py-20 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading delivery details...</p>
        </div>
      )}

      {!loading && !selectedJobId && (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border-light)' }}
        >
          <span className="text-4xl mb-3 inline-block">🚛</span>
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>No Shipment Selected</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Choose a shipment from the dropdown above to view delivery stops, cargo checklist, and live proof of delivery.
          </p>
        </div>
      )}

      {!loading && currentJob && (
        <div className="space-y-6">
          {/* Delivered Notification Banner for Company and Trucker */}
          {isDelivered && (
            <div
              className="p-5 rounded-2xl flex items-start justify-between gap-4"
              style={{ backgroundColor: '#10B98115', border: '1px solid #10B98140' }}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                  ✓
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                      Cargo Successfully Delivered & Verified
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-700">
                      Company Notified ✓
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 mt-1">
                    All {currentJob.boxes?.length || 0} packages were verified intact with zero transit damage.
                    {deliveries[0]?.recipient_name && ` Signed and accepted by ${deliveries[0].recipient_name}.`}
                  </p>
                  {deliveries[0]?.delivered_at && (
                    <p className="text-[11px] text-emerald-700/80 mt-1">
                      Delivered at: {new Date(deliveries[0].delivered_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500 text-white shadow-sm shrink-0">
                Delivered
              </span>
            </div>
          )}

          {/* Job Overview Card */}
          <div
            className="p-6 rounded-2xl"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="flex items-center justify-between mb-4 pb-4 flex-wrap gap-2" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                  Active Shipment Details
                </span>
                <h2 className="text-xl font-bold mt-0.5" style={{ color: 'var(--color-text)' }}>{currentJob.job_name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[currentJob.status] || ''}`}>
                  {currentJob.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Route & Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Origin */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-surface)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📍</span>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    Pickup Origin
                  </p>
                </div>
                <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                  {currentJob.pickup_location || 'Designated Pickup Location'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Date: {currentJob.date}
                </p>
              </div>

              {/* Destination */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-surface)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🏁</span>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    Delivery Destination
                  </p>
                </div>
                <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                  {currentJob.delivery_location || deliveries[0]?.address || 'Final Consignee Dock'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Window: {currentJob.time_window || 'Standard Business Hours'}
                </p>
              </div>

              {/* Carrier Truck & Driver */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-surface)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🚛</span>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    Carrier Fleet
                  </p>
                </div>
                {currentJob.truck ? (
                  <>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                      {currentJob.truck.truck_type} ({currentJob.truck.license_plate})
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      Driver: {currentJob.truck.driver_name || 'Assigned Driver'}
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    No truck assigned yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Stops & Proof of Delivery */}
          <div
            className="p-6 rounded-2xl"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                  Delivery Destination Stops ({deliveries.length})
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Multi-stop delivery points and proof-of-delivery acknowledgments
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {deliveries.map((d) => (
                <div
                  key={d.id}
                  className="p-5 rounded-xl transition-all"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                        style={{
                          backgroundColor: d.status === 'delivered' ? '#10B98120' : 'var(--color-primary)' + '15',
                          color: d.status === 'delivered' ? '#10B981' : 'var(--color-primary)',
                        }}
                      >
                        #{d.stop_order}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                            {d.recipient_name}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              d.status === 'delivered'
                                ? 'bg-emerald-500/15 text-emerald-600'
                                : 'bg-blue-500/15 text-blue-600'
                            }`}
                          >
                            {d.status}
                          </span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          📍 {d.address || 'Standard Delivery Location'}
                        </p>
                        {d.notes && (
                          <p className="text-xs mt-1.5 p-2 rounded-lg bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300">
                            💬 Notes: {d.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {d.status === 'delivered' && d.delivered_at && (
                        <div>
                          <span className="text-[11px] font-medium text-emerald-600 block">
                            ✓ Delivered on {new Date(d.delivered_at).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {new Date(d.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                      {d.status !== 'delivered' && (
                        <span className="text-xs text-amber-600 font-medium bg-amber-500/10 px-2.5 py-1 rounded-full">
                          ⏳ Handover Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {d.status === 'delivered' && (
                    <div
                      className="mt-4 pt-3 flex items-center gap-6 text-xs flex-wrap"
                      style={{ borderTop: '1px solid var(--color-border-light)', color: 'var(--color-text-muted)' }}
                    >
                      <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                        <span>✓</span>
                        <span>Driver Load Checklist Verified</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                        <span>✍</span>
                        <span>Recipient Handover Acknowledged</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                        <span>📦</span>
                        <span>Zero Package Damage</span>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cargo Package Verification Status */}
          {currentJob.boxes && currentJob.boxes.length > 0 && (
            <div
              className="p-6 rounded-2xl"
              style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                    Cargo Manifest & Package Handover ({currentJob.boxes.length} Boxes)
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    Individual item condition and package delivery verification
                  </p>
                </div>
                {isDelivered && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 font-semibold">
                    All {currentJob.boxes.length} Packages Verified ✓
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentJob.boxes.map((box: any, idx: number) => (
                  <div
                    key={box.id}
                    className="p-3.5 rounded-xl flex items-center justify-between gap-3"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}
                  >
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                        #{idx + 1} {box.label_reference}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {box.length_cm}×{box.width_cm}×{box.height_cm} cm • {box.weight_kg} kg
                      </p>
                      <div className="flex gap-1.5 mt-1">
                        {box.fragile && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600">
                            ⚠ Fragile
                          </span>
                        )}
                        {box.hazard && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-500/15 text-red-600">
                            ☢ Hazard
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      {isDelivered ? (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <span>✓</span>
                          <span>Unloaded</span>
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-amber-600">
                          In Transit
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Driver Unloading & Delivery Verification Checklist Modal */}
      {showVerifyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={() => setShowVerifyModal(false)}
        >
          <div
            className="w-full max-w-xl p-6 rounded-2xl shadow-2xl animate-fade-in my-8"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
              <div>
                <h3 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
                  🏁 Delivery Unloading & Verification Checklist
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Driver must verify all cargo boxes and handover details before ending the trip
                </p>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold hover:bg-black/10 dark:hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteDelivery} className="space-y-4">
              {/* Step 1: Package Unload Check */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    1. Cargo Unloading Checklist ({checkedBoxIds.size}/{currentJob?.boxes?.length || 0})
                  </label>
                  <button
                    type="button"
                    onClick={selectAllBoxes}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    {checkedBoxIds.size === (currentJob?.boxes?.length || 0) ? 'Deselect All' : 'Select All Boxes ✓'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                  {currentJob?.boxes?.map((box: any, idx: number) => {
                    const isChecked = checkedBoxIds.has(box.id);
                    return (
                      <div
                        key={box.id}
                        onClick={() => toggleBox(box.id)}
                        className={`p-2.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isChecked ? 'bg-emerald-500/15 border border-emerald-500/30 font-semibold' : 'hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBox(box.id)}
                            className="rounded accent-emerald-600"
                          />
                          <span>#{idx + 1} {box.label_reference}</span>
                        </div>
                        <span className="text-[11px] text-gray-500">
                          {box.length_cm}×{box.width_cm}×{box.height_cm} cm • {box.weight_kg} kg
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Quality & Inspection Protocols */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                  2. Driver Delivery Quality Verification
                </label>
                <div className="space-y-2">
                  {[
                    { key: 'intact_packaging', label: 'All cargo boxes unloaded in intact, undamaged condition' },
                    { key: 'count_verified', label: 'Total package count matches consignment manifest' },
                    { key: 'no_transit_damage', label: 'Zero shock, leakage, or water transit damage observed' },
                    { key: 'receiver_handover', label: 'Receiver / Consignee acknowledged physical handover' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        checked={qualityChecks.has(item.key)}
                        onChange={() => toggleQualityCheck(item.key)}
                        className="rounded accent-emerald-600"
                      />
                      <span style={{ color: 'var(--color-text)' }}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Step 3: Recipient & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Recipient / Receiver Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar (Warehouse Mgr)"
                    className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Delivery Notes / Dock #
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="e.g. Received at Gate 2, dock 4"
                    className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              {/* Company Notification Disclaimer */}
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <span className="text-base">📢</span>
                <span>
                  Confirming this delivery will instantly complete the trip, update proof of delivery, and dispatch an official <strong>Delivery Notification to the Shipper / Company</strong>.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDelivery || qualityChecks.size < 4}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#10B981' }}
                >
                  {isSubmittingDelivery ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Completing & Notifying Company...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Confirm Delivery & Notify Company</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
