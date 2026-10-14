import { Suspense } from 'react';
import Link from 'next/link';
import HomeAuthCard from '@/components/HomeAuthCard';

const roles = [
  {
    name: 'Company',
    tag: 'SHIPPER WORKSPACE',
    description: 'Post freight jobs, discover the right capacity, build efficient load plans and monitor every handoff.',
    roleId: 'company',
    accent: '#176451',
    icon: '01',
  },
  {
    name: 'Trucker',
    tag: 'FLEET WORKSPACE',
    description: 'Publish trucks, manage drivers, accept job requests and complete verified deliveries.',
    roleId: 'trucker',
    accent: '#315F7E',
    icon: '02',
  },
  {
    name: 'Administrator',
    tag: 'CONTROL CENTER',
    description: 'Oversee users, jobs, fleet operators and the complete platform activity trail.',
    roleId: 'admin',
    accent: '#A66C33',
    icon: '03',
  },
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
      {/* Navigation */}
      <header className="home-nav">
        <Link href="/" className="home-brand" aria-label="CargoSync home">
          <img src="/cargosync-mark.svg" alt="CargoSync logo" />
          <span>Cargo<span>Sync</span></span>
        </Link>
        <nav aria-label="Homepage navigation">
          <a href="#about">About</a>
          <a href="#workflow">Workflow</a>
          <a href="#portals">Workspaces</a>
        </nav>
        <a href="#access" className="home-nav-cta">
          Sign In / Register <span>↓</span>
        </a>
      </header>

      {/* Hero Section with Unified Login Card */}
      <section className="home-hero">
        <img src="/cargosync-hero.png" alt="Modern freight truck at an intelligent logistics hub" />
        <div className="home-hero-shade" />

        <div className="home-hero-grid">
          {/* Left Column: Headline and Value Proposition */}
          <div className="home-hero-content">
            <p className="home-kicker"><span /> Intelligent freight orchestration</p>
            <h1>Every load.<br />Perfectly <em>in sync.</em></h1>
            <p className="home-lead">
              CargoSync connects shippers, fleet operators, and logistics teams through smarter matching, 3D load planning, verified QR handoffs and complete chain of custody.
            </p>
            <div className="home-hero-actions">
              <a href="#access" className="home-button home-button-primary">Access Your Workspace <span>↘</span></a>
              <a href="#about" className="home-button home-button-ghost">See How It Works</a>
            </div>
            <div className="home-proof">
              <div><strong>3D</strong><span>Load planning</span></div>
              <div><strong>QR</strong><span>Chain of custody</span></div>
              <div><strong>1</strong><span>Unified platform</span></div>
            </div>
          </div>

          {/* Right Column: Direct Front Page Login & Registration Card */}
          <div className="flex justify-center lg:justify-end w-full">
            <Suspense fallback={
              <div
                className="w-full max-w-[480px] h-[520px] rounded-3xl animate-pulse"
                style={{ background: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(22, 53, 45, 0.12)' }}
              />
            }>
              <HomeAuthCard />
            </Suspense>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="home-about home-section">
        <div className="home-section-label">ABOUT CARGOSYNC</div>
        <div className="home-about-grid">
          <h2>Logistics should feel coordinated, not complicated.</h2>
          <div>
            <p className="home-about-lead">
              CargoSync is an intelligent freight and fleet orchestration platform built to remove the gaps between posting a job and proving it was delivered.
            </p>
            <p>
              Companies find suitable capacity and prepare cargo with visual packing tools. Truckers manage their fleet, accept the right work and verify every movement. Administrators retain a clear view of users, jobs and operational logs—all in one connected system right from the front page.
            </p>
          </div>
        </div>
        <div className="home-feature-strip">
          <span>Truck discovery</span>
          <i />
          <span>3D bin packing</span>
          <i />
          <span>QR verification</span>
          <i />
          <span>Delivery feedback</span>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="home-workflow home-section">
        <div className="home-workflow-copy">
          <div className="home-section-label light">ONE CONTINUOUS WORKFLOW</div>
          <h2>From available capacity to confirmed delivery.</h2>
          <p>
            CargoSync keeps every participant aligned around the same job record, the same cargo plan and the same verifiable milestones.
          </p>
          <div className="home-workflow-list">
            {workflow.map((item) => (
              <article key={item.number}>
                <span>{item.number}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="home-workflow-visual">
          <img src="/cargosync-workflow.png" alt="CargoSync workflow from smart loading and QR scanning to transport and final delivery" />
          <div className="home-image-note">
            <strong>Visible at every step</strong>
            <span>One shared operational picture from warehouse to recipient.</span>
          </div>
        </div>
      </section>

      {/* Role Workspaces Section (Direct Links to Front Page Form) */}
      <section id="portals" className="home-portals home-section">
        <div className="home-portals-heading">
          <div>
            <div className="home-section-label">CHOOSE YOUR WORKSPACE</div>
            <h2>One platform.<br />Three focused experiences.</h2>
          </div>
          <p>
            Select your workspace below to sign in or create an account directly on this page without jumping between separate login portals.
          </p>
        </div>
        <div className="home-role-grid">
          {roles.map((role) => (
            <article
              key={role.name}
              className="home-role-card"
              style={{ '--role-accent': role.accent } as React.CSSProperties}
            >
              <div className="home-role-top">
                <span>{role.icon}</span>
                <small>{role.tag}</small>
              </div>
              <h3>{role.name}</h3>
              <p>{role.description}</p>
              <div className="home-role-actions">
                <Link href={`/?role=${role.roleId}&mode=login#access`}>
                  Sign in <span>→</span>
                </Link>
                <Link href={`/?role=${role.roleId}&mode=register#access`}>
                  Create account
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-brand">
          <img src="/cargosync-mark.svg" alt="" />
          <span>Cargo<span>Sync</span></span>
        </div>
        <p>Intelligent freight &amp; fleet orchestration.</p>
        <a href="#access">Open CargoSync Login ↑</a>
      </footer>
    </main>
  );
}
