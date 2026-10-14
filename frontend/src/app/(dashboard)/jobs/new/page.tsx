'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function NewJobPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    job_name: '',
    pickup_datetime: '',
    delivery_datetime: '',
    description: '',
    pickup_location: '',
    delivery_location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Extract date and time components
      const pickupDate = form.pickup_datetime
        ? form.pickup_datetime.split('T')[0]
        : '';
      const pickupTime =
        form.pickup_datetime && form.pickup_datetime.includes('T')
          ? form.pickup_datetime.split('T')[1]
          : '';
      const deliveryFormatted = form.delivery_datetime
        ? form.delivery_datetime.replace('T', ' ')
        : '';

      // Format time_window to store delivery date and time (with pickup time if provided)
      const timeWindow = deliveryFormatted
        ? pickupTime
          ? `${pickupTime} → ${deliveryFormatted}`
          : deliveryFormatted
        : pickupTime || undefined;

      const { data } = await api.post('/jobs/', {
        job_name: form.job_name,
        description: form.description,
        pickup_location: form.pickup_location,
        delivery_location: form.delivery_location,
        date: pickupDate || form.pickup_datetime,
        time_window: timeWindow,
      });
      router.push(`/jobs/${data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
        Create New Job
      </h1>

      {error && (
        <div
          className="mb-6 p-4 rounded-xl text-sm flex items-center justify-between"
          style={{
            backgroundColor: '#C25B5615',
            color: 'var(--color-danger)',
            border: '1px solid #C25B5630',
          }}
        >
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-4 font-bold hover:opacity-70">
            ×
          </button>
        </div>
      )}

      <div
        className="p-6 rounded-2xl"
        style={{
          backgroundColor: 'var(--color-card)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--color-border-light)',
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
              Job Name
            </label>
            <input
              value={form.job_name}
              onChange={(e) => setForm({ ...form, job_name: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={inputStyle}
              placeholder="e.g. Mumbai to Delhi Shipment"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
              Job Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={inputStyle}
              placeholder="Cargo type, handling needs, approximate weight and other instructions"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Pickup location
              <input
                required
                value={form.pickup_location}
                onChange={(e) => setForm({ ...form, pickup_location: e.target.value })}
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                style={inputStyle}
                placeholder="City / Warehouse / Address"
              />
            </label>
            <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Delivery location
              <input
                required
                value={form.delivery_location}
                onChange={(e) => setForm({ ...form, delivery_location: e.target.value })}
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                style={inputStyle}
                placeholder="Destination City / Dock"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                Pickup Date and Time
              </label>
              <input
                type="datetime-local"
                value={form.pickup_datetime}
                onChange={(e) => setForm({ ...form, pickup_datetime: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                Delivery Date and Time
              </label>
              <input
                type="datetime-local"
                value={form.delivery_datetime}
                onChange={(e) => setForm({ ...form, delivery_datetime: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
              style={{ backgroundColor: 'var(--color-primary)', boxShadow: 'var(--shadow-warm)' }}
            >
              {loading ? 'Creating...' : 'Create Job'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
