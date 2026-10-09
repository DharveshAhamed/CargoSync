import Link from 'next/link';

const roles = [
  { name: 'Company', tag: 'SHIPPER WORKSPACE', description: 'Post freight jobs, discover the right capacity, build efficient load plans and monitor every handoff.', login: '/company/login', register: '/company/register', accent: '#176451', icon: '01' },
  { name: 'Trucker', tag: 'FLEET WORKSPACE', description: 'Publish trucks, manage drivers, accept job requests and complete verified deliveries.', login: '/trucker/login', register: '/trucker/register', accent: '#315F7E', icon: '02' },
  { name: 'Administrator', tag: 'CONTROL CENTER', description: 'Oversee users, jobs, fleet operators and the complete platform activity trail.', login: '/admin/login', register: '/admin/register', accent: '#A66C33', icon: '03' },
];

const workflow = [
  { number: '01', title: 'Post & match', body: 'Companies describe cargo and discover available trucks by real capacity.' },
  { number: '02', title: 'Plan the load', body: '3D bin packing turns dimensions and weight into a practical loading plan.' },
  { number: '03', title: 'Verify custody', body: 'QR scans confirm loading, transit and unloading events as they happen.' },
  { number: '04', title: 'Deliver & learn', body: 'Complete delivery, preserve the audit trail and rate the driver experience.' },
];

export default function Home() {
  return (
    <main className="home-shell">
      <header className="home-nav">
        <Link href="/" className="home-brand" aria-label="CargoSync home">
          <img src="/cargosync-mark.svg" alt="CargoSync logo" />
          <span>Cargo<span>Sync</span></span>
        </Link>
        <nav aria-label="Homepage navigation"><a href="#about">About</a><a href="#workflow">Workflow</a><a href="#portals">Portals</a></nav>
        <Link href="/login" className="home-nav-cta">Sign in <span>→</span></Link>
      </header>

      <section className="home-hero">
        <img src="/cargosync-hero.png" alt="Modern freight truck at an intelligent logistics hub" />
        <div className="home-hero-shade" />
        <div className="home-hero-content">
          <p className="home-kicker"><span /> Intelligent freight orchestration</p>
          <h1>Every load.<br />Perfectly <em>in sync.</em></h1>
          <p className="home-lead">CargoSync connects shippers and fleet operators through smarter matching, 3D load planning, verified handoffs and a complete delivery trail.</p>
          <div className="home-hero-actions">
            <a href="#portals" className="home-button home-button-primary">Choose your portal <span>↘</span></a>
            <a href="#about" className="home-button home-button-ghost">See how it works</a>
          </div>
          <div className="home-proof">
            <div><strong>3D</strong><span>Load planning</span></div>
            <div><strong>QR</strong><span>Chain of custody</span></div>
            <div><strong>1</strong><span>Connected workflow</span></div>
          </div>
        </div>
      </section>

      <section id="about" className="home-about home-section">
        <div className="home-section-label">ABOUT CARGOSYNC</div>
        <div className="home-about-grid">
          <h2>Logistics should feel coordinated, not complicated.</h2>
          <div>
            <p className="home-about-lead">CargoSync is an intelligent freight and fleet orchestration platform built to remove the gaps between posting a job and proving it was delivered.</p>
            <p>Companies find suitable capacity and prepare cargo with visual packing tools. Truckers manage their fleet, accept the right work and verify every movement. Administrators retain a clear view of users, jobs and operational logs—all in one connected system.</p>
          </div>
        </div>
        <div className="home-feature-strip"><span>Truck discovery</span><i /><span>3D bin packing</span><i /><span>QR verification</span><i /><span>Delivery feedback</span></div>
      </section>

      <section id="workflow" className="home-workflow home-section">
        <div className="home-workflow-copy">
          <div className="home-section-label light">ONE CONTINUOUS WORKFLOW</div>
          <h2>From available capacity to confirmed delivery.</h2>
          <p>CargoSync keeps every participant aligned around the same job record, the same cargo plan and the same verifiable milestones.</p>
          <div className="home-workflow-list">
            {workflow.map(item => <article key={item.number}><span>{item.number}</span><div><h3>{item.title}</h3><p>{item.body}</p></div></article>)}
          </div>
        </div>
        <div className="home-workflow-visual">
          <img src="/cargosync-workflow.png" alt="CargoSync workflow from smart loading and QR scanning to transport and final delivery" />
          <div className="home-image-note"><strong>Visible at every step</strong><span>One shared operational picture from warehouse to recipient.</span></div>
        </div>
      </section>

      <section id="portals" className="home-portals home-section">
        <div className="home-portals-heading">
          <div><div className="home-section-label">CHOOSE YOUR WORKSPACE</div><h2>One platform.<br />Three focused experiences.</h2></div>
          <p>Enter the workspace designed around your role. New to CargoSync? Create your account directly from the card.</p>
        </div>
        <div className="home-role-grid">
          {roles.map(role => (
            <article key={role.name} className="home-role-card" style={{'--role-accent': role.accent} as React.CSSProperties}>
              <div className="home-role-top"><span>{role.icon}</span><small>{role.tag}</small></div>
              <h3>{role.name}</h3><p>{role.description}</p>
              <div className="home-role-actions"><Link href={role.login}>Sign in <span>→</span></Link><Link href={role.register}>Create account</Link></div>
            </article>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-brand"><img src="/cargosync-mark.svg" alt="" /><span>Cargo<span>Sync</span></span></div>
        <p>Intelligent freight &amp; fleet orchestration.</p>
        <Link href="/login">Open CargoSync →</Link>
      </footer>
    </main>
  );
}
