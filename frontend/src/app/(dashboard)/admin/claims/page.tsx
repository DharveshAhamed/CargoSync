'use client';

export default function AdminClaimsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Admin — Claims</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Review and manage dispute claims</p>
      </div>

      <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border-light)' }}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'var(--color-surface)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No claims submitted yet</p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Claims will appear here when companies submit dispute requests</p>
      </div>
    </div>
  );
}
