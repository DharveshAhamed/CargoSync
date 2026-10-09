import Link from 'next/link';

const portals = [
  { href: '/company/login', registerHref: '/company/register', registerLabel: 'Register company', title: 'Company', eyebrow: 'SHIPPER PORTAL', description: 'Post freight jobs, find trucks, plan cargo and track delivery.', color: 'var(--color-primary)' },
  { href: '/trucker/login', registerHref: '/trucker/register', registerLabel: 'Register trucker', title: 'Trucker', eyebrow: 'FLEET PORTAL', description: 'Manage vehicles and drivers, accept requests and complete deliveries.', color: 'var(--color-secondary)' },
  { href: '/admin/login', registerHref: '/admin/register', registerLabel: 'First-time setup', title: 'Administrator', eyebrow: 'CONTROL CENTER', description: 'Review users, jobs, truckers and platform activity logs.', color: 'var(--color-text)' },
];

export default function PortalSelector() {
  return <main className="min-h-screen px-6 py-12 flex items-center" style={{background:'radial-gradient(circle at 15% 10%, #e9f6ef 0, transparent 38%), var(--color-bg)'}}>
    <div className="max-w-5xl mx-auto w-full">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-3 mb-5"><div className="w-11 h-11 rounded-xl grid place-items-center text-white" style={{background:'var(--color-primary)'}}>🚚</div><span className="text-2xl font-bold">CargoSync</span></div>
        <p className="text-xs font-semibold tracking-[.24em] mb-3" style={{color:'var(--color-primary)'}}>ONE NETWORK. EVERY DELIVERY.</p>
        <h1 className="text-4xl md:text-5xl font-bold" style={{color:'var(--color-text)'}}>Choose your workspace</h1>
        <p className="mt-3" style={{color:'var(--color-text-secondary)'}}>Each role has its own secure portal and purpose-built workflow.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {portals.map(p => <div key={p.href} className="group p-7 rounded-2xl transition-all hover:-translate-y-1" style={{background:'var(--color-card)',border:'1px solid var(--color-border-light)',boxShadow:'var(--shadow-sm)'}}>
          <div className="w-12 h-1 rounded-full mb-8" style={{background:p.color}} />
          <p className="text-[11px] font-bold tracking-[.18em]" style={{color:p.color}}>{p.eyebrow}</p>
          <h2 className="text-2xl font-bold mt-2" style={{color:'var(--color-text)'}}>{p.title}</h2>
          <p className="text-sm leading-6 mt-3 mb-8" style={{color:'var(--color-text-secondary)'}}>{p.description}</p>
          <div className="flex items-center justify-between gap-3"><Link href={p.href} className="text-sm font-semibold" style={{color:p.color}}>Sign in →</Link><Link href={p.registerHref} className="text-xs font-medium hover:underline" style={{color:'var(--color-text-muted)'}}>{p.registerLabel}</Link></div>
        </div>)}
      </div>
    </div>
  </main>;
}
