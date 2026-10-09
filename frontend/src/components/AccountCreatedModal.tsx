'use client';

export default function AccountCreatedModal({
  accountLabel,
  onContinue,
}: {
  accountLabel: string;
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-6" style={{background:'rgba(18, 31, 27, 0.58)', backdropFilter:'blur(6px)'}}>
      <div role="dialog" aria-modal="true" aria-labelledby="account-created-title" className="w-full max-w-sm rounded-3xl p-8 text-center animate-fade-in" style={{background:'var(--color-card)',border:'1px solid var(--color-border-light)',boxShadow:'0 28px 80px rgba(12, 35, 27, .28)'}}>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full text-3xl text-white" style={{background:'var(--color-success)'}}>✓</div>
        <p className="mt-6 text-xs font-bold tracking-[.18em]" style={{color:'var(--color-success)'}}>REGISTRATION COMPLETE</p>
        <h2 id="account-created-title" className="mt-2 text-2xl font-bold" style={{color:'var(--color-text)'}}>Account created successfully</h2>
        <p className="mt-3 text-sm leading-6" style={{color:'var(--color-text-secondary)'}}>Your {accountLabel} account was saved to Supabase. You can now continue to your dashboard.</p>
        <button autoFocus onClick={onContinue} className="mt-7 w-full rounded-xl py-3 text-sm font-semibold text-white" style={{background:'var(--color-primary)'}}>Continue to dashboard</button>
      </div>
    </div>
  );
}
