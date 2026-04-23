'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 140; i++) {
      const p = document.createElement('div');
      p.className = 'sparkle';
      const size = Math.random() * 3 + 1.5;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.setProperty('--duration', `${Math.random() * 3 + 2}s`);
      p.style.animationDelay = `${Math.random() * 5}s`;
      container.appendChild(p);
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', overflowX: 'hidden', position: 'relative' }}>

      {/* Particle background */}
      <div
        ref={particlesRef}
        className="mask-radial"
        style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.3, pointerEvents: 'none' }}
      />

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
        padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="font-display" style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>Club Manager</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button
            onClick={() => router.push('/login')}
            style={{
              padding: '8px 20px', border: '1px solid #525252', background: 'rgba(64,64,64,0.6)',
              borderRadius: '999px', fontSize: '14px', fontWeight: 600, color: '#fff',
              cursor: 'pointer', letterSpacing: '0.02em', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = '#a3a3a3'; (e.target as HTMLButtonElement).style.background = 'rgba(82,82,82,0.8)'; }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = '#525252'; (e.target as HTMLButtonElement).style.background = 'rgba(64,64,64,0.6)'; }}
          >
            Sign In
          </button>
          <button
            onClick={() => router.push('/signup')}
            style={{
              padding: '8px 24px', background: '#fff', color: '#000',
              borderRadius: '999px', fontSize: '14px', fontWeight: 700, border: '1px solid #fff',
              cursor: 'pointer', letterSpacing: '0.02em', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.background = 'transparent'; b.style.color = '#fff'; b.style.boxShadow = '0 0 25px rgba(255,255,255,0.4)'; }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.background = '#fff'; b.style.color = '#000'; b.style.boxShadow = 'none'; }}
          >
            JOIN NOW
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7"/><path d="M7 7h10v10"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10, padding: '0 16px' }}>
        <div style={{ width: '100%', maxWidth: '1280px', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '96px' }}>

          <h1 className="font-display" style={{
            fontSize: 'clamp(56px, 10vw, 120px)', fontWeight: 700,
            letterSpacing: '-0.04em', textTransform: 'uppercase',
            textAlign: 'center', lineHeight: 1, color: '#fff', whiteSpace: 'nowrap',
          }}>
            Club Manager
          </h1>

          {/* Gradient line + sparkles visual */}
          <div style={{ width: '100%', maxWidth: '1280px', height: '160px', position: 'relative', marginTop: '8px' }}>
            {/* Indigo gradient line */}
            <div style={{ position: 'absolute', top: 0, left: '5%', right: '5%', height: '2px', background: 'linear-gradient(to right, transparent, #6366f1, transparent)', filter: 'blur(2px)' }} />
            <div style={{ position: 'absolute', top: 0, left: '5%', right: '5%', height: '1px', background: 'linear-gradient(to right, transparent, #6366f1, transparent)' }} />
            {/* Sky gradient line */}
            <div style={{ position: 'absolute', top: 0, left: '35%', right: '35%', height: '5px', background: 'linear-gradient(to right, transparent, #0ea5e9, transparent)', filter: 'blur(2px)' }} />
            <div style={{ position: 'absolute', top: 0, left: '35%', right: '35%', height: '1px', background: 'linear-gradient(to right, transparent, #0ea5e9, transparent)' }} />
            {/* Radial mask to fade bottom */}
            <div style={{ position: 'absolute', inset: 0, background: '#000', maskImage: 'radial-gradient(350px 200px at top, transparent 20%, white)', WebkitMaskImage: 'radial-gradient(350px 200px at top, transparent 20%, white)' }} />
          </div>

          {/* Scroll indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '32px', zIndex: 20 }}>
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5em', color: '#525252', textTransform: 'uppercase' }}>SCROLL</span>
            <div style={{ width: '1px', height: '48px', background: 'linear-gradient(to bottom, transparent, #333, transparent)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.4)', animation: 'scroll-dot 2s infinite' }} />
            </div>
          </div>

          {/* Tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.4em', color: '#a3a3a3', textTransform: 'uppercase' }}>
            <span>Governance</span>
            <span style={{ color: '#262626' }}>·</span>
            <span>Execution</span>
            <span style={{ color: '#262626' }}>·</span>
            <span>Proof</span>
          </div>
        </div>
      </main>

      {/* Choose Interface Section */}
      <section style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '128px 32px', borderTop: '1px solid #171717' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.4em', color: '#525252', textTransform: 'uppercase', marginBottom: '48px' }}>Choose Your Interface</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', width: '100%' }}>

            {/* Admin Card */}
            <a
              href="/login"
              style={{
                position: 'relative', padding: '48px', borderRadius: '32px',
                border: '1px solid #171717', background: '#050505',
                textDecoration: 'none', color: 'inherit', display: 'block',
                cursor: 'pointer', transition: 'background 0.3s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#050505'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
                <div style={{ width: '6px', height: '6px', background: '#6366f1', borderRadius: '50%', boxShadow: '0 0 8px rgba(99,102,241,0.8)' }} />
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', color: '#818cf8', textTransform: 'uppercase' }}>Executive Systems</span>
              </div>
              <h3 style={{ fontSize: '36px', fontWeight: 500, marginBottom: '16px', letterSpacing: '-0.02em' }}>Admin Panel</h3>
              <p style={{ color: '#525252', fontSize: '14px', lineHeight: 1.6, maxWidth: '280px' }}>
                Architect the organization. Orchestrate domains, approve talent, and analyze global velocity from a single command center.
              </p>
              <div style={{ marginTop: '48px', width: '100%', height: '1px', background: '#171717' }} />
              <svg style={{ position: 'absolute', bottom: '40px', right: '40px', color: '#404040', transition: 'all 0.5s', width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </a>

            {/* Member Card */}
            <a
              href="/login"
              style={{
                position: 'relative', padding: '48px', borderRadius: '32px',
                border: '1px solid #171717', background: '#050505',
                textDecoration: 'none', color: 'inherit', display: 'block',
                cursor: 'pointer', transition: 'background 0.3s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#050505'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
                <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px rgba(16,185,129,0.8)' }} />
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', color: '#34d399', textTransform: 'uppercase' }}>Contributor Node</span>
              </div>
              <h3 style={{ fontSize: '36px', fontWeight: 500, marginBottom: '16px', letterSpacing: '-0.02em' }}>Member Portal</h3>
              <p style={{ color: '#525252', fontSize: '14px', lineHeight: 1.6, maxWidth: '280px' }}>
                The mission center for high-output execution. Access the real-time Kanban board and submit verified proof-of-work.
              </p>
              <div style={{ marginTop: '48px', width: '100%', height: '1px', background: '#171717' }} />
              <svg style={{ position: 'absolute', bottom: '40px', right: '40px', color: '#404040', transition: 'all 0.5s', width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </a>

          </div>
        </div>

        <footer style={{ marginTop: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#404040', fontSize: '10px', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
          © 2026 Club Manager
        </footer>
      </section>

      {/* Floating N badge */}
      <div style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 50 }}>
        <div style={{ width: '40px', height: '40px', border: '1px solid #262626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', cursor: 'pointer', transition: 'border-color 0.2s' }}>
          <span style={{ fontSize: '12px', fontWeight: 700 }}>N</span>
        </div>
      </div>

    </div>
  );
}
