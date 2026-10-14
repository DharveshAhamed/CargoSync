'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import type { JobDetail } from '@/types';
import { getUser } from '@/lib/auth';

const LoadPlanViewer = dynamic(() => import('@/components/three/LoadPlanViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 flex flex-col items-center justify-center text-gray-400 gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      <span className="text-xs">Loading 3D Visualizer Engine...</span>
    </div>
  ),
});

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
  pack_rotation?: number;
  checked: boolean;
}

interface ChecklistResponse {
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
    approved_by: string;
    approved_at: string;
    notes?: string;
    safety_checks?: string[];
    checked_count: number;
    total_count: number;
  } | null;
  boxes: ChecklistBox[];
}

export default function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [checklist, setChecklist] = useState<ChecklistResponse | null>(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showAddBox, setShowAddBox] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isComputing, setIsComputing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [deletingBoxId, setDeletingBoxId] = useState<string | null>(null);

  // Checklist form state
  const [checkedBoxIds, setCheckedBoxIds] = useState<Set<string>>(new Set());
  const [selectedSafetyChecks, setSelectedSafetyChecks] = useState<Set<string>>(new Set());
  const [driverName, setDriverName] = useState('');
  const [driverNotes, setDriverNotes] = useState('');

  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const currentUser = getUser();
  const isCompany = currentUser?.user_type === 'company';
  const isTrucker = currentUser?.user_type === 'trucker';
  const isAdmin = currentUser?.user_type === 'admin';
  const canPack = isTrucker || isAdmin; // Only trucker (and admin) can 3D pack
  const canAddBox = (isCompany || isAdmin) && (job ? job.status !== 'in_transit' && job.status !== 'delivered' : true); // Only company can add boxes

  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const [isEndingTrip, setIsEndingTrip] = useState(false);
  const [isAcceptingJob, setIsAcceptingJob] = useState(false);

  // Delivery Unload Verification modal state
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveredBoxes, setDeliveredBoxes] = useState<Set<string>>(new Set());
  const [deliverySafetyChecks, setDeliverySafetyChecks] = useState<Set<string>>(new Set([
    'intact_packaging',
    'count_verified',
    'no_transit_damage',
    'receiver_handover',
  ]));
  const [deliveryRecipient, setDeliveryRecipient] = useState('');
  const [deliveryHandoverNotes, setDeliveryHandoverNotes] = useState('');

  // Consolidated multi-job bundling state
  const [bundledJobs, setBundledJobs] = useState<any[]>([]);
  const [bundleCandidates, setBundleCandidates] = useState<any[]>([]);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [selectedBundleJobId, setSelectedBundleJobId] = useState('');
  const [isBundling, setIsBundling] = useState(false);

  const [boxForm, setBoxForm] = useState({
    label_reference: '',
    length_cm: '',
    width_cm: '',
    height_cm: '',
    weight_kg: '',
    quantity: '1',
    fragile: false,
    hazard: false,
  });

  useEffect(() => {
    if (id) {
      loadJob();
      loadChecklist();
      loadBundledJobs();
      loadBundleCandidates();
    }
  }, [id]);

  const loadJob = async () => {
    try {
      const { data } = await api.get(`/jobs/${id}`);
      setJob(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load job details');
    }
  };

  const loadBundledJobs = async () => {
    try {
      const { data } = await api.get(`/jobs/${id}/bundled-jobs`);
      setBundledJobs(data);
    } catch {
      // Handled silently
    }
  };

  const loadBundleCandidates = async () => {
    try {
      const { data } = await api.get(`/jobs/${id}/bundle-candidates`);
      setBundleCandidates(data);
    } catch {
      // Handled silently
    }
  };

  const handleBundleJob = async () => {
    if (!selectedBundleJobId) return;
    setIsBundling(true);
    setError('');
    setSuccessMsg('');
    try {
      const { data } = await api.post(`/jobs/${id}/bundle-job`, { bundle_job_id: selectedBundleJobId });
      setSuccessMsg(data.message || 'Job added to truck and 3D cargo packed together!');
      setShowBundleModal(false);
      setSelectedBundleJobId('');
      await loadJob();
      await loadBundledJobs();
      await loadChecklist();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to combine job onto truck');
    } finally {
      setIsBundling(false);
    }
  };

  const loadChecklist = async () => {
    try {
      const { data } = await api.get(`/checklist/${id}`);
      setChecklist(data);

      const checkedIds = new Set<string>();
      data.boxes.forEach((b: ChecklistBox) => {
        if (b.checked) checkedIds.add(b.id);
      });
      setCheckedBoxIds(checkedIds);

      if (data.approval?.safety_checks && data.approval.safety_checks.length > 0) {
        setSelectedSafetyChecks(new Set(data.approval.safety_checks));
      } else {
        setSelectedSafetyChecks(new Set(data.default_safety_checks));
      }

      setDriverName(data.approval?.approved_by || currentUser?.name || '');
      setDriverNotes(data.approval?.notes || '');
    } catch {
      // Checklist load fails silently if job is newly initialized
    }
  };

  const addBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddBox) {
      setError('Only the shipper/company can add cargo boxes to this job');
      return;
    }
    try {
      const count = Math.max(1, parseInt(boxForm.quantity) || 1);
      const promises = [];
      for (let i = 1; i <= count; i++) {
        const label = count > 1 ? `${boxForm.label_reference} (#${i})` : boxForm.label_reference;
        promises.push(
          api.post('/boxes/', {
            job_id: id,
            label_reference: label,
            length_cm: +boxForm.length_cm,
            width_cm: +boxForm.width_cm,
            height_cm: +boxForm.height_cm,
            weight_kg: +boxForm.weight_kg,
            stop_order: 1,
            fragile: boxForm.fragile,
            hazard: boxForm.hazard,
          })
        );
      }
      await Promise.all(promises);

      setBoxForm({
        label_reference: '',
        length_cm: '',
        width_cm: '',
        height_cm: '',
        weight_kg: '',
        quantity: '1',
        fragile: false,
        hazard: false,
      });
      setShowAddBox(false);
      setSuccessMsg(
        count > 1
          ? `Added ${count} boxes to shipment. Assigned trucker will 3D pack them into the container upon accepting the job.`
          : `Box added to shipment. Assigned trucker will 3D pack it into the container upon accepting the job.`
      );
      loadJob();
      loadChecklist();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add box');
    }
  };

  const deleteBox = async (boxId: string) => {
    if (!canAddBox) {
      setError('Only the shipper/company can remove cargo boxes');
      return;
    }
    setDeletingBoxId(boxId);
    try {
      await api.delete(`/boxes/${boxId}`);
      setSuccessMsg('Box removed from shipment.');
      loadJob();
      loadChecklist();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete box');
    } finally {
      setDeletingBoxId(null);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      await api.put(`/jobs/${id}`, { status: newStatus });
      loadJob();
      loadChecklist();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update status');
    }
  };

  const computePacking = async () => {
    if (!canPack) {
      setError('Only the trucker assigned can run 3D bin packing');
      return;
    }
    setIsComputing(true);
    setError('');
    setSuccessMsg('');
    try {
      const { data } = await api.post(`/packing/compute/${id}`);
      const prevCount = data.previous_placements?.length || 0;
      setSuccessMsg(
        prevCount > 0
          ? `✓ 3D packing plan computed! ${data.placements?.length || 0} boxes placed (${prevCount} boxes already loaded from other active jobs in this truck). Total efficiency: ${data.efficiency}%`
          : `✓ 3D packing plan computed! ${data.placements?.length || 0} boxes placed (${data.efficiency}% efficiency)`
      );
      loadJob();
      loadChecklist();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to compute packing');
    } finally {
      setIsComputing(false);
    }
  };

  const handleStartTrip = async () => {
    setIsStartingTrip(true);
    setError('');
    setSuccessMsg('');
    try {
      const { data } = await api.post(`/jobs/${id}/start-trip`);
      setSuccessMsg(data.message || '🚀 Trip started! Cargo is now in transit.');
      await loadJob();
      await loadChecklist();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start trip');
    } finally {
      setIsStartingTrip(false);
    }
  };

  const handleEndTrip = () => {
    if (job?.boxes) {
      setDeliveredBoxes(new Set(job.boxes.map((b: any) => b.id)));
    }
    if (!deliveryRecipient && job?.company) {
      setDeliveryRecipient(job.company.company_name || 'Consignee Receiving');
    }
    setShowDeliveryModal(true);
  };

  const confirmEndTrip = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (job?.boxes && job.boxes.length > 0 && deliveredBoxes.size < job.boxes.length) {
      setError(`Please verify all ${job.boxes.length} cargo packages before completing delivery.`);
      return;
    }
    setIsEndingTrip(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        recipient_name: deliveryRecipient.trim() || (job?.company?.company_name || 'Consignee Receiving'),
        notes: deliveryHandoverNotes.trim() || 'All packages verified, unloaded intact without transit damage.',
        verified_box_ids: Array.from(deliveredBoxes),
        condition_verified: true,
      };
      const { data } = await api.post(`/jobs/${id}/end-trip`, payload);
      setSuccessMsg(data.message || '🏁 Job completed! Cargo safely delivered at destination. Company has been notified.');
      setShowDeliveryModal(false);
      await loadJob();
      await loadChecklist();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to complete delivery');
    } finally {
      setIsEndingTrip(false);
    }
  };

  const handleAcceptJob = async () => {
    setIsAcceptingJob(true);
    setError('');
    setSuccessMsg('');
    try {
      const { data } = await api.post(`/jobs/${id}/accept`);
      setSuccessMsg(data.message || 'Job accepted into your fleet truck!');
      await loadJob();
      await loadChecklist();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to accept job');
    } finally {
      setIsAcceptingJob(false);
    }
  };

  const toggleBoxCheck = (boxId: string) => {
    setCheckedBoxIds((prev) => {
      const next = new Set(prev);
      if (next.has(boxId)) {
        next.delete(boxId);
      } else {
        next.add(boxId);
      }
      return next;
    });
  };

  const selectAllBoxes = () => {
    if (!checklist) return;
    if (checkedBoxIds.size === checklist.boxes.length) {
      setCheckedBoxIds(new Set());
    } else {
      setCheckedBoxIds(new Set(checklist.boxes.map((b) => b.id)));
    }
  };

  const toggleSafetyCheck = (item: string) => {
    setSelectedSafetyChecks((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const submitChecklistApproval = async () => {
    if (!driverName.trim()) {
      setError('Please provide the driver / inspector name.');
      return;
    }
    setIsApproving(true);
    setError('');
    setSuccessMsg('');
    try {
      const { data } = await api.post(`/checklist/approve/${id}`, {
        driver_name: driverName.trim(),
        checked_box_ids: Array.from(checkedBoxIds),
        safety_checks: Array.from(selectedSafetyChecks),
        notes: driverNotes.trim() || undefined,
        advance_status: true,
      });
      setSuccessMsg(data.message || '✓ Cargo loading approved by driver!');
      setShowChecklistModal(false);
      loadJob();
      loadChecklist();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to approve loading checklist');
    } finally {
      setIsApproving(false);
    }
  };

  const downloadSheet = async () => {
    try {
      const res = await api.get(`/packing/loading-sheet/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `loading_sheet_${job?.job_name || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to download loading sheet');
    }
  };

  const submitRating = async () => {
    try {
      await api.post(`/jobs/${id}/rating`, { rating, feedback });
      loadJob();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit feedback');
    }
  };

  if (!job) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse-warm w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
      </div>
    );
  }

  const parsedPacking = job.packing_data ? JSON.parse(job.packing_data) : null;
  const isApproved = checklist?.approval?.approved;
  const totalBoxesCount = checklist?.total_boxes || job.boxes.length;
  const checkedCount = checklist?.checked_boxes || checkedBoxIds.size;

  const statusFlow = ['draft', 'posted', 'matched', 'accepted', 'loading', 'in_transit', 'out_for_delivery', 'delivered'];
  const currentIndex = statusFlow.indexOf(job.status);
  const inputStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <Link href="/jobs" className="text-sm hover:underline" style={{ color: 'var(--color-primary)' }}>
            ← Back to Jobs
          </Link>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              {job.job_name}
            </h1>
            {parsedPacking && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                3D Plan Ready ({parsedPacking.efficiency}%)
              </span>
            )}
            {isApproved ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
                ✓ Driver Approved ({checklist?.approval?.approved_by})
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                Checklist: {checkedCount}/{totalBoxesCount} Checked
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs flex-wrap" style={{ color: 'var(--color-text-muted)' }}>
            <span><strong>Pickup:</strong> {job.date}</span>
            {job.time_window && (
              <>
                <span>•</span>
                <span><strong>Delivery:</strong> {job.time_window}</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap justify-end items-center">
          {/* Trucker: Accept Available Job */}
          {isTrucker && ['posted', 'matched', 'draft'].includes(job.status) && (
            <button
              onClick={handleAcceptJob}
              disabled={isAcceptingJob}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-secondary)' }}
            >
              {isAcceptingJob ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Accepting Job...
                </>
              ) : (
                <>
                  <span>🤝</span>
                  <span>Accept Job with Fleet Truck</span>
                </>
              )}
            </button>
          )}

          {/* Trucker: Combine with Another Available Job */}
          {isTrucker && job.truck && ['accepted', 'loading'].includes(job.status) && (
            <button
              onClick={() => {
                loadBundleCandidates();
                setShowBundleModal(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-all hover:scale-[1.02]"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <span>➕</span>
              <span>Combine with Another Job</span>
            </button>
          )}

          {/* Trucker: Start Trip */}
          {isTrucker && ['accepted', 'loading'].includes(job.status) && (
            <button
              onClick={handleStartTrip}
              disabled={isStartingTrip || (!parsedPacking && job.boxes.length > 0)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ backgroundColor: '#10B981' }}
              title={!parsedPacking && job.boxes.length > 0 ? 'Pack boxes in 3D first to start trip' : 'Start trip to destination'}
            >
              {isStartingTrip ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Starting Trip...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Start Trip</span>
                </>
              )}
            </button>
          )}

          {/* Trucker: End Job at Destination */}
          {isTrucker && ['in_transit', 'out_for_delivery'].includes(job.status) && (
            <button
              onClick={handleEndTrip}
              disabled={isEndingTrip}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ backgroundColor: '#8B5CF6' }}
            >
              {isEndingTrip ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Ending Job...
                </>
              ) : (
                <>
                  <span>🏁</span>
                  <span>End Job at Destination</span>
                </>
              )}
            </button>
          )}

          {/* 3D Packing (Only for Trucker / Admin) */}
          {canPack && job.truck && job.boxes.length > 0 && (
            <button
              onClick={computePacking}
              disabled={isComputing}
              className="px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-info)' + '15',
                color: 'var(--color-info)',
                border: '1px solid var(--color-info)' + '35',
              }}
            >
              {isComputing ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Computing...
                </>
              ) : (
                '🧊 Compute Packing'
              )}
            </button>
          )}

          {/* Driver Loading Checklist & Approval Button */}
          {job.truck && job.boxes.length > 0 && (
            <button
              onClick={() => setShowChecklistModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:opacity-90"
              style={{
                backgroundColor: isApproved ? 'rgba(34, 197, 94, 0.15)' : 'var(--color-accent)20',
                color: isApproved ? '#16a34a' : '#9E6F19',
                border: `1px solid ${isApproved ? 'rgba(34, 197, 94, 0.35)' : 'var(--color-accent)45'}`,
              }}
            >
              <span>📋</span>
              <span>Driver Checklist {isApproved ? '✓ Approved' : `(${checkedCount}/${totalBoxesCount})`}</span>
            </button>
          )}

          <Link
            href={`/load-plan/${id}`}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:opacity-90"
            style={{
              backgroundColor: 'var(--color-secondary)' + '20',
              color: 'var(--color-secondary)',
              border: '1px solid var(--color-secondary)' + '40',
            }}
          >
            🔲 3D View
          </Link>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl mb-6 bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-xs font-bold px-2">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-xs font-bold px-2">✕</button>
        </div>
      )}

      {/* Delivered Notification Banner for Company and Trucker */}
      {job.status === 'delivered' && (
        <div
          className="p-5 rounded-2xl mb-6 flex items-center justify-between gap-4 flex-wrap"
          style={{ backgroundColor: '#10B98115', border: '1px solid #10B98140' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-xl shrink-0">
              🎉
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                  Cargo Successfully Delivered & Verified
                </p>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-700">
                  Company Notified ✓
                </span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-400 mt-0.5">
                All packages were verified intact by driver at {job.delivery_location || 'destination dock'}. Handover complete.
              </p>
            </div>
          </div>
          <Link
            href="/deliveries"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition"
          >
            Track in Deliveries ➔
          </Link>
        </div>
      )}

      {/* Origin / Destination Banner */}
      {(job.description || job.pickup_location || job.delivery_location) && (
        <div
          className="p-5 rounded-2xl mb-6"
          style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-light)' }}
        >
          <p className="text-sm font-semibold">
            {job.pickup_location || 'Pickup pending'} → {job.delivery_location || 'Destination pending'}
          </p>
          {job.description && (
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              {job.description}
            </p>
          )}
        </div>
      )}

      {/* Consolidated Truck Trip Card */}
      {bundledJobs.length > 1 && (
        <div
          className="p-5 rounded-2xl mb-6"
          style={{ backgroundColor: '#1A365D15', border: '1px solid #2B6CB040' }}
        >
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🚛</span>
              <div>
                <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                  Consolidated Truck Trip ({bundledJobs.length} Jobs on {job.truck?.truck_name || 'Fleet Truck'} - {job.truck?.plate_number || ''})
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Multiple shipments loaded together into this vehicle container
                </p>
              </div>
            </div>
            {isTrucker && ['accepted', 'loading'].includes(job.status) && (
              <button
                onClick={() => {
                  loadBundleCandidates();
                  setShowBundleModal(true);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                + Combine More Cargo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {bundledJobs.map((bj) => (
              <div
                key={bj.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  bj.is_current
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 font-semibold'
                    : 'bg-white/60 dark:bg-black/20 border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--color-text)' }}>
                    {bj.job_name} {bj.is_current && '(Active)'}
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 font-bold uppercase">
                    {bj.status}
                  </span>
                </div>
                <p className="text-[11px] mt-1 text-gray-500">
                  {bj.box_count} boxes • {bj.total_weight_kg} kg
                </p>
                <p className="text-[11px] text-gray-500 truncate">
                  📍 {bj.pickup_location || 'Origin'} ➔ {bj.delivery_location || 'Destination'}
                </p>
                {!bj.is_current && (
                  <Link
                    href={`/jobs/${bj.id}`}
                    className="text-[11px] text-blue-600 font-bold hover:underline mt-2 inline-block"
                  >
                    View Job in 3D ➔
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3D Cargo Packing & Load Visualization */}
      <div
        className="p-5 rounded-2xl mb-6"
        style={{
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-primary)' + '35',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Multi-Job Active Cargo Banner */}
        {parsedPacking?.previous_placements && parsedPacking.previous_placements.length > 0 && (
          <div className="mb-4 p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-700 dark:text-sky-300 flex items-start gap-2.5">
            <span className="text-lg">🚛</span>
            <div>
              <p className="font-bold">Multi-Job Active Cargo Loaded in Truck</p>
              <p className="text-[11px] text-sky-600/90 dark:text-sky-300 mt-0.5">
                This truck is also transporting {parsedPacking.previous_placements.length} box(es) from active job(s) ({Array.from(new Set(parsedPacking.previous_placements.map((p: any) => p.job_name || 'Active Cargo'))).join(', ')}). Those boxes occupy space in the 3D container, and this job&apos;s cargo is placed in the remaining capacity.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧊</span>
              <h3 className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                3D Cargo Packing Arrangement
              </h3>
              {parsedPacking && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                  {parsedPacking.efficiency}% Truck Volume Used
                </span>
              )}
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {parsedPacking
                ? `${parsedPacking.placements?.length || 0} boxes placed (${parsedPacking.current_job_weight || parsedPacking.total_weight} kg)${parsedPacking.previous_placements?.length ? ` + ${parsedPacking.previous_placements.length} previous boxes from active jobs in this truck` : ''} • Total load: ${parsedPacking.total_weight} kg`
                : job.boxes.length > 0
                ? `${job.boxes.length} box${job.boxes.length > 1 ? 'es' : ''} configured. ${canPack ? 'Pack now to compute 3D container coordinates.' : 'Driver will compute 3D container coordinates.'}`
                : 'Add boxes below to calculate 3D packing plan.'}
              {job.truck && (
                <span className="ml-2 text-gray-500">
                  (Truck: {job.truck.length_cm}×{job.truck.width_cm}×{job.truck.height_cm} cm)
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canPack && job.truck && job.boxes.length > 0 && (
              <button
                onClick={computePacking}
                disabled={isComputing}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {isComputing ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Packing 3D Cargo...</span>
                  </>
                ) : (
                  <>
                    <span>📦</span>
                    <span>{parsedPacking ? 'Re-pack Boxes (3D)' : 'Pack Boxes (3D)'}</span>
                  </>
                )}
              </button>
            )}

            {!canPack && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 font-medium">
                ℹ Trucker manages 3D packing
              </span>
            )}

            {parsedPacking && (
              <>
                <button
                  onClick={downloadSheet}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  📄 Loading PDF
                </button>
                <Link
                  href={`/load-plan/${id}`}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--color-secondary)' + '20',
                    color: 'var(--color-secondary)',
                    border: '1px solid var(--color-secondary)' + '40',
                  }}
                >
                  <span>⛶</span>
                  <span>Full Screen 3D</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Live Interactive 3D Scene */}
        {parsedPacking && (parsedPacking.placements?.length > 0 || (parsedPacking.previous_placements && parsedPacking.previous_placements.length > 0)) ? (
          <div
            className="w-full h-[450px] rounded-xl overflow-hidden relative shadow-inner"
            style={{ backgroundColor: '#0d1117', border: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <LoadPlanViewer packingData={parsedPacking} />
          </div>
        ) : job.boxes.length > 0 ? (
          <div
            className="w-full py-10 rounded-xl flex flex-col items-center justify-center text-center p-6"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px dashed var(--color-border)' }}
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-2xl mb-3">
              📦
            </div>
            <h4 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
              Ready to generate 3D packing plan
            </h4>
            <p className="text-xs max-w-md mt-1 mb-4" style={{ color: 'var(--color-text-muted)' }}>
              {job.boxes.length} box{job.boxes.length > 1 ? 'es' : ''} configured. {canPack ? 'Click below to pack the boxes inside the truck container according to their dimensions (and any previously loaded cargo).' : 'Waiting for the assigned trucker to pack boxes and compute container arrangement.'}
            </p>
            {canPack && (
              <button
                onClick={computePacking}
                disabled={isComputing}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all hover:scale-[1.02]"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {isComputing ? 'Packing Boxes...' : '📦 Pack Boxes (3D)'}
              </button>
            )}
          </div>
        ) : (
          <div
            className="w-full py-8 rounded-xl flex flex-col items-center justify-center text-center p-6"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px dashed var(--color-border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              No boxes added yet. Add boxes below to preview interactive 3D cargo arrangement.
            </p>
          </div>
        )}
      </div>

      {/* Status timeline */}
      <div
        className="p-5 rounded-2xl mb-6"
        style={{
          backgroundColor: 'var(--color-card)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--color-border-light)',
        }}
      >
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {statusFlow.map((s, i) => (
            <div key={s} className="flex items-center">
              <button
                onClick={() => (i === currentIndex + 1 ? updateStatus(s) : undefined)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  i <= currentIndex
                    ? 'text-white'
                    : i === currentIndex + 1
                    ? 'cursor-pointer hover:opacity-80'
                    : 'opacity-40'
                }`}
                style={
                  i <= currentIndex
                    ? { backgroundColor: 'var(--color-primary)' }
                    : i === currentIndex + 1
                    ? {
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-primary)',
                        border: '1px solid var(--color-primary)',
                      }
                    : { backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }
                }
                disabled={i !== currentIndex + 1}
              >
                {s.replace('_', ' ')}
              </button>
              {i < statusFlow.length - 1 && (
                <div
                  className="w-4 h-px mx-1"
                  style={{ backgroundColor: i < currentIndex ? 'var(--color-primary)' : 'var(--color-border)' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Trucker Trip Control Banner */}
      {isTrucker && (
        <div
          className="p-5 rounded-2xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-primary)' + '35',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {['draft', 'posted', 'matched'].includes(job.status)
                  ? '🤝'
                  : ['accepted', 'loading'].includes(job.status)
                  ? '🚀'
                  : ['in_transit', 'out_for_delivery'].includes(job.status)
                  ? '🚚'
                  : '🏁'}
              </span>
              <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                {['draft', 'posted', 'matched'].includes(job.status)
                  ? 'Job Available for Acceptance'
                  : ['accepted', 'loading'].includes(job.status)
                  ? 'Trip Ready to Launch'
                  : ['in_transit', 'out_for_delivery'].includes(job.status)
                  ? 'Trip In Transit to Destination'
                  : 'Trip Completed'}
              </h3>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {['draft', 'posted', 'matched'].includes(job.status)
                ? 'Accept this freight job into your fleet truck to begin loading cargo.'
                : ['accepted', 'loading'].includes(job.status)
                ? (!parsedPacking && job.boxes.length > 0)
                  ? '⚠️ Please run "Pack Boxes (3D)" to verify container placement before starting trip.'
                  : 'All boxes placed and verified in 3D. Launch trip to begin delivery.'
                : ['in_transit', 'out_for_delivery'].includes(job.status)
                ? 'You are on the road! Once you reach the delivery destination, click "End Job at Destination".'
                : 'This job has been marked as delivered at destination. Thank you!'}
            </p>
          </div>

          <div>
            {['draft', 'posted', 'matched'].includes(job.status) && (
              <button
                onClick={handleAcceptJob}
                disabled={isAcceptingJob}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-secondary)' }}
              >
                {isAcceptingJob ? 'Accepting Job...' : '🤝 Accept Job with Fleet Truck'}
              </button>
            )}

            {['accepted', 'loading'].includes(job.status) && (
              <button
                onClick={handleStartTrip}
                disabled={isStartingTrip || (!parsedPacking && job.boxes.length > 0)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
                style={{ backgroundColor: '#10B981' }}
                title={!parsedPacking && job.boxes.length > 0 ? 'Pack boxes in 3D first' : 'Start trip'}
              >
                {isStartingTrip ? 'Launching Trip...' : '🚀 Start Trip'}
              </button>
            )}

            {['in_transit', 'out_for_delivery'].includes(job.status) && (
              <button
                onClick={handleEndTrip}
                disabled={isEndingTrip}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
                style={{ backgroundColor: '#8B5CF6' }}
              >
                {isEndingTrip ? 'Completing Job...' : '🏁 End Job at Destination'}
              </button>
            )}
          </div>
        </div>
      )}

      {isCompany && job.status === 'delivered' && (
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-light)' }}
        >
          <h2 className="font-semibold">Rate the driver</h2>
          {job.rating ? (
            <p className="mt-3 text-sm">
              {'★'.repeat(job.rating)} <span style={{ color: 'var(--color-text-secondary)' }}>{job.feedback}</span>
            </p>
          ) : (
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <select
                value={rating}
                onChange={(e) => setRating(+e.target.value)}
                className="px-3 py-2.5 rounded-xl"
                style={{ border: '1px solid var(--color-border)' }}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} stars
                  </option>
                ))}
              </select>
              <input
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl"
                style={{ border: '1px solid var(--color-border)' }}
                placeholder="Share feedback about this delivery"
              />
              <button
                onClick={submitRating}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ background: 'var(--color-primary)' }}
              >
                Submit
              </button>
            </div>
          )}
        </div>
      )}

      {/* Truck info */}
      {job.truck && (
        <div
          className="p-4 rounded-2xl mb-6"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Assigned Truck
          </p>
          <p className="text-sm font-semibold mt-1" style={{ color: 'var(--color-text)' }}>
            {job.truck.truck_name} ({job.truck.plate_number}) — {job.truck.length_cm}×{job.truck.width_cm}×
            {job.truck.height_cm} cm, Max: {job.truck.max_weight_kg} kg
          </p>
        </div>
      )}

      {/* Cargo Boxes Section */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{
          backgroundColor: 'var(--color-card)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--color-border-light)',
        }}
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>
              Boxes / Cargo ({job.boxes.length})
            </h2>
            {isApproved ? (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-semibold border border-emerald-500/30">
                Driver Approved ✓
              </span>
            ) : (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 font-medium border border-amber-500/30">
                {checkedCount}/{totalBoxesCount} Checked
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canPack && job.truck && job.boxes.length > 0 && (
              <button
                onClick={computePacking}
                disabled={isComputing}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {isComputing ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Packing Boxes...</span>
                  </>
                ) : (
                  <>
                    <span>📦</span>
                    <span>Pack Boxes (3D)</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => setShowChecklistModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
              style={{
                backgroundColor: 'var(--color-primary)' + '15',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-primary)' + '35',
              }}
            >
              📋 Open Loading Checklist
            </button>
            {canAddBox && (
              <button
                onClick={() => setShowAddBox(!showAddBox)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm flex items-center gap-1 transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {showAddBox ? '✕ Cancel' : '+ Add Box'}
              </button>
            )}
          </div>
        </div>

        {showAddBox && (
          <form
            onSubmit={addBox}
            className="mb-4 p-4 rounded-xl animate-fade-in"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <input
                placeholder="Label"
                value={boxForm.label_reference}
                onChange={(e) => setBoxForm({ ...boxForm, label_reference: e.target.value })}
                required
                className="px-3 py-2 rounded-lg text-xs focus:outline-none"
                style={inputStyle}
              />
              <input
                placeholder="Length (cm)"
                type="number"
                value={boxForm.length_cm}
                onChange={(e) => setBoxForm({ ...boxForm, length_cm: e.target.value })}
                required
                className="px-3 py-2 rounded-lg text-xs focus:outline-none"
                style={inputStyle}
              />
              <input
                placeholder="Width (cm)"
                type="number"
                value={boxForm.width_cm}
                onChange={(e) => setBoxForm({ ...boxForm, width_cm: e.target.value })}
                required
                className="px-3 py-2 rounded-lg text-xs focus:outline-none"
                style={inputStyle}
              />
              <input
                placeholder="Height (cm)"
                type="number"
                value={boxForm.height_cm}
                onChange={(e) => setBoxForm({ ...boxForm, height_cm: e.target.value })}
                required
                className="px-3 py-2 rounded-lg text-xs focus:outline-none"
                style={inputStyle}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <input
                placeholder="Weight (kg)"
                type="number"
                value={boxForm.weight_kg}
                onChange={(e) => setBoxForm({ ...boxForm, weight_kg: e.target.value })}
                required
                className="px-3 py-2 rounded-lg text-xs focus:outline-none"
                style={inputStyle}
              />
              <input
                placeholder="Number of boxes"
                type="number"
                min="1"
                value={boxForm.quantity}
                onChange={(e) => setBoxForm({ ...boxForm, quantity: e.target.value })}
                required
                className="px-3 py-2 rounded-lg text-xs focus:outline-none"
                style={inputStyle}
                title="Number of boxes with these dimensions"
              />
              <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={boxForm.fragile}
                  onChange={(e) => setBoxForm({ ...boxForm, fragile: e.target.checked })}
                  style={{ accentColor: 'var(--color-warning)' }}
                />{' '}
                Fragile
              </label>
              <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={boxForm.hazard}
                  onChange={(e) => setBoxForm({ ...boxForm, hazard: e.target.checked })}
                  style={{ accentColor: 'var(--color-danger)' }}
                />{' '}
                Hazardous
              </label>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white text-xs font-semibold"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              + Add Box{parseInt(boxForm.quantity) > 1 ? `es (${boxForm.quantity})` : ''}
            </button>
          </form>
        )}

        <div className="space-y-2">
          {job.boxes.map((box: any, idx: number) => {
            const isBoxChecked = checkedBoxIds.has(box.id) || !!isApproved;

            return (
              <div
                key={box.id}
                className="flex items-center justify-between p-3.5 rounded-xl transition-all"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: 'var(--color-primary)' + '15', color: 'var(--color-primary)' }}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        {box.label_reference}
                      </p>
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
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isBoxChecked ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 font-semibold border border-emerald-500/30 flex items-center gap-1">
                      <span>✓</span>
                      <span>Inspected & Loaded</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        toggleBoxCheck(box.id);
                        setShowChecklistModal(true);
                      }}
                      className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 font-medium border border-amber-500/30 hover:opacity-80 transition-all flex items-center gap-1"
                    >
                      <span>⏳</span>
                      <span>Pending Load Check</span>
                    </button>
                  )}
                  {canAddBox && (
                    <button
                      onClick={() => deleteBox(box.id)}
                      disabled={deletingBoxId === box.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors text-xs"
                      title="Remove box"
                    >
                      {deletingBoxId === box.id ? '…' : '🗑'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Driver Loading Checklist & Approval Modal */}
      {showChecklistModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={() => setShowChecklistModal(false)}
        >
          <div
            className="p-6 rounded-2xl max-w-2xl w-full my-8 shadow-2xl relative animate-scale-in"
            style={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                    Driver Cargo Loading Checklist
                  </h3>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {job.job_name} • Truck: {job.truck?.truck_name} ({job.truck?.plate_number})
                </p>
              </div>
              <button
                onClick={() => setShowChecklistModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Checklist Progress Bar */}
            <div className="my-4 p-4 rounded-xl bg-slate-500/10 border border-slate-500/20">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span>Verification Progress</span>
                <span className={checkedBoxIds.size === job.boxes.length ? 'text-emerald-600 font-bold' : ''}>
                  {checkedBoxIds.size} / {job.boxes.length} Cargo Items Verified (
                  {Math.round((checkedBoxIds.size / (job.boxes.length || 1)) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(checkedBoxIds.size / (job.boxes.length || 1)) * 100}%`,
                    backgroundColor: checkedBoxIds.size === job.boxes.length ? '#16a34a' : 'var(--color-primary)',
                  }}
                />
              </div>
            </div>

            {/* Existing Approval Banner */}
            {checklist?.approval?.approved && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <span>✓</span>
                  <span>Loading Approved by Driver: {checklist.approval.approved_by}</span>
                </div>
                <p>
                  Timestamp: {new Date(checklist.approval.approved_at).toLocaleString()} • {checklist.approval.checked_count} of {checklist.approval.total_count} boxes verified
                </p>
                {checklist.approval.notes && (
                  <p className="italic text-gray-600 dark:text-gray-400 pt-1">
                    Notes: &ldquo;{checklist.approval.notes}&rdquo;
                  </p>
                )}
              </div>
            )}

            {/* Section 1: Cargo Box Items Checklist */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                  1. Cargo Items Manifest Check
                </h4>
                <button
                  onClick={selectAllBoxes}
                  type="button"
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  {checkedBoxIds.size === job.boxes.length ? 'Deselect All' : 'Select / Verify All'}
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {job.boxes.map((box: any, idx: number) => {
                  const isChecked = checkedBoxIds.has(box.id);

                  return (
                    <label
                      key={box.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : 'border-gray-200 dark:border-gray-800 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleBoxCheck(box.id)}
                        className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        style={{ accentColor: '#16a34a' }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                            {box.label_reference}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-600">
                            Box #{idx + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span>
                            {box.length_cm}×{box.width_cm}×{box.height_cm} cm
                          </span>
                          <span>•</span>
                          <span>{box.weight_kg} kg</span>
                          {box.fragile && <span className="text-amber-600 font-semibold">⚠ Fragile</span>}
                          {box.hazard && <span className="text-red-600 font-semibold">☢ Hazard</span>}
                        </div>
                        {box.pack_x !== null && box.pack_x !== undefined && (
                          <div className="text-[11px] text-emerald-600 mt-1">
                            3D Position: ({box.pack_x}, {box.pack_y}, {box.pack_z}) cm
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Driver Safety & Rigging Checks */}
            <div className="mb-6">
              <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text)' }}>
                2. Cargo Rigging & Safety Inspection
              </h4>
              <div className="space-y-2">
                {(checklist?.default_safety_checks || [
                  'Cargo placed according to 3D packing sequence & reverse stop order',
                  'Weight distributed evenly across truck axles within max capacity',
                  'Fragile items secured on top layer without heavy overhead weight',
                  'Hazardous cargo isolated, strapped, and properly labeled',
                  'Load locks, tie-down straps, or cargo nets firmly fastened',
                  'Container seal inspected and vehicle pre-trip check complete',
                ]).map((item) => {
                  const checked = selectedSafetyChecks.has(item);

                  return (
                    <label
                      key={item}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSafetyCheck(item)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      <span className={checked ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-500'}>
                        {item}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Driver Signature & Notes */}
            <div className="mb-6 space-y-3">
              <h4 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                3. Driver Approval & Sign-Off
              </h4>
              <div>
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

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Inspection Notes / Seal # (Optional)
                </label>
                <textarea
                  value={driverNotes}
                  onChange={(e) => setDriverNotes(e.target.value)}
                  placeholder="e.g. All 3 boxes loaded according to 3D model, ratchet straps tightened, seal #KL-882 applied."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Link
                href={`/load-plan/${id}`}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>🔲</span>
                <span>Open 3D Model to cross-verify placement</span>
              </Link>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowChecklistModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={submitChecklistApproval}
                  disabled={isApproving || !driverName.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                  style={{ backgroundColor: '#16a34a' }}
                >
                  {isApproving ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Approving Loading...
                    </>
                  ) : (
                    '✓ Approve & Sign Off Loading'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Driver Unloading & Delivery Verification Checklist Modal */}
      {showDeliveryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={() => setShowDeliveryModal(false)}
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
                  Driver must verify all cargo boxes and handover condition before completing trip
                </p>
              </div>
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold hover:bg-black/10 dark:hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={confirmEndTrip} className="space-y-4">
              {/* Step 1: Package Unload Check */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    1. Cargo Unloading Checklist ({deliveredBoxes.size}/{job.boxes.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (deliveredBoxes.size === job.boxes.length) {
                        setDeliveredBoxes(new Set());
                      } else {
                        setDeliveredBoxes(new Set(job.boxes.map((b: any) => b.id)));
                      }
                    }}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    {deliveredBoxes.size === job.boxes.length ? 'Deselect All' : 'Select All Packages ✓'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                  {job.boxes.map((box: any, idx: number) => {
                    const isChecked = deliveredBoxes.has(box.id);
                    return (
                      <div
                        key={box.id}
                        onClick={() => {
                          const next = new Set(deliveredBoxes);
                          if (next.has(box.id)) next.delete(box.id);
                          else next.add(box.id);
                          setDeliveredBoxes(next);
                        }}
                        className={`p-2.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isChecked ? 'bg-emerald-500/15 border border-emerald-500/30 font-semibold' : 'hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
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

              {/* Step 2: Quality & Safety Checks */}
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
                        checked={deliverySafetyChecks.has(item.key)}
                        onChange={() => {
                          const next = new Set(deliverySafetyChecks);
                          if (next.has(item.key)) next.delete(item.key);
                          else next.add(item.key);
                          setDeliverySafetyChecks(next);
                        }}
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
                    value={deliveryRecipient}
                    onChange={(e) => setDeliveryRecipient(e.target.value)}
                    placeholder="e.g. Rajesh Kumar (Warehouse Mgr)"
                    className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Delivery Notes / Dock #
                  </label>
                  <input
                    type="text"
                    value={deliveryHandoverNotes}
                    onChange={(e) => setDeliveryHandoverNotes(e.target.value)}
                    placeholder="e.g. Received at Gate 2, dock 4"
                    className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Company Notification Disclaimer */}
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <span className="text-base">📢</span>
                <span>
                  Confirming this delivery will complete the trip, release container capacity, and dispatch an official <strong>Delivery Notification to the Shipper / Company</strong>.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEndingTrip || deliverySafetyChecks.size < 4}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#10B981' }}
                >
                  {isEndingTrip ? (
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

      {/* Trucker: Combine Another Job to this Truck Modal */}
      {showBundleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={() => setShowBundleModal(false)}
        >
          <div
            className="w-full max-w-xl p-6 rounded-2xl shadow-2xl animate-fade-in my-8"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
              <div>
                <h3 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
                  🚛 Combine Another Job to this Truck Trip
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Load another available job into remaining truck container space before departure
                </p>
              </div>
              <button
                onClick={() => setShowBundleModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold hover:bg-black/10 dark:hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200">
                <p className="font-semibold">Truck Container Status:</p>
                <p className="mt-0.5">
                  Vehicle: <strong>{job.truck?.truck_name || 'Fleet Truck'} ({job.truck?.plate_number || ''})</strong>
                  {' '}• Current Job has <strong>{job.boxes.length} boxes</strong> loaded.
                </p>
                <p className="mt-0.5 text-blue-700 dark:text-blue-300">
                  Selecting an available job will assign it to this truck and compute 3D bin packing so new boxes fit alongside previous boxes.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
                    Available Open Jobs ({bundleCandidates.length} found)
                  </label>
                  <button
                    type="button"
                    onClick={loadBundleCandidates}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    ↻ Refresh List
                  </button>
                </div>

                {bundleCandidates.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                    <p className="text-xs text-gray-500">No other open/posted jobs available to bundle right now.</p>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {bundleCandidates.map((c) => {
                      const isSelected = selectedBundleJobId === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedBundleJobId(c.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-500/15 border-blue-500 shadow-sm'
                              : 'bg-black/5 dark:bg-white/5 border-transparent hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                              {c.job_name}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-500/15 text-blue-600 uppercase">
                                {c.status}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/15 text-emerald-600">
                                {c.box_count} Boxes
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] mt-1 text-gray-500">
                            📍 {c.pickup_location || 'Origin'} ➔ {c.delivery_location || 'Destination'}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Weight: {c.total_weight_kg} kg • {c.company_name ? `Shipper: ${c.company_name}` : ''}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowBundleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBundleJob}
                  disabled={!selectedBundleJobId || isBundling}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {isBundling ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Consolidating & Packing 3D...</span>
                    </>
                  ) : (
                    <>
                      <span>📦</span>
                      <span>Combine Job & Pack Cargo in 3D</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
