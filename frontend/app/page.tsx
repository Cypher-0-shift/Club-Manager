'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const particlesRef = useRef<HTMLDivElement>(null);
  const heroParticlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Page background particles
    const container = particlesRef.current;
    if (container) {
      container.innerHTML = '';
      for (let i = 0; i < 140; i++) {
        const p = document.createElement('div');
        p.className = 'sparkle';
        const size = Math.random() * 2 + 1.5;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${Math.random() * 100}%`;
        p.style.top = `${Math.random() * 100}%`;
        p.style.setProperty('--duration', `${Math.random() * 3 + 2}s`);
        p.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(p);
      }
    }

    // Hero localized particles
    const heroContainer = heroParticlesRef.current;
    if (heroContainer) {
      heroContainer.innerHTML = '';
      for (let i = 0; i < 250; i++) {
        const p = document.createElement('div');
        p.className = 'sparkle';
        const size = Math.random() * 3.5 + 1.5;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${Math.random() * 100}%`;
        p.style.top = `${Math.random() * 100}%`;
        p.style.setProperty('--duration', `${Math.random() * 3 + 2}s`);
        p.style.animationDelay = `${Math.random() * 5}s`;
        heroContainer.appendChild(p);
      }
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
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
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
            onClick={() => setShowJoinModal(true)}
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
              <path d="M7 17L17 7" /><path d="M7 7h10v10" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10, padding: '0 16px' }}>
        <div style={{ width: '100%', maxWidth: '1480px', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '96px' }}>

          <h1 className="font-display" style={{
            fontSize: 'clamp(56px, 10vw, 120px)', fontWeight: 700,
            letterSpacing: '-0.04em', textTransform: 'uppercase',
            textAlign: 'center', lineHeight: 1, color: '#fff', whiteSpace: 'nowrap',
          }}>
            Club Manager
          </h1>

          {/* Visual Container (Gradients and Sparkles) */}
          <div style={{ width: '100%', maxWidth: '1280px', height: '160px', position: 'relative', marginTop: '8px', overflow: 'hidden' }}>
            {/* Top Gradient Lines */}
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '2px', background: 'linear-gradient(to right, transparent, #6366f1, transparent)', filter: 'blur(3px)', opacity: 0.8 }} />
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(to right, transparent, #6366f1, transparent)' }} />
            <div style={{ position: 'absolute', top: 0, left: '30%', right: '30%', height: '5px', background: 'linear-gradient(to right, transparent, #0ea5e9, transparent)', filter: 'blur(4px)', opacity: 0.6 }} />
            <div style={{ position: 'absolute', top: 0, left: '30%', right: '30%', height: '1px', background: 'linear-gradient(to right, transparent, #0ea5e9, transparent)' }} />

            {/* Sparkles Container */}
            <div ref={heroParticlesRef} style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }} />

            {/* Radial Mask to fade bottom and blend */}
            <div style={{ position: 'absolute', inset: 0, background: '#000', maskImage: 'radial-gradient(350px 200px at top, transparent 20%, white)', WebkitMaskImage: 'radial-gradient(350px 200px at top, transparent 20%, white)' }} />
          </div>

          {/* Scroll Indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: '32px 0', zIndex: 20 }}>
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5em', color: '#525252', textTransform: 'uppercase' }}>Scroll</span>
            <div style={{ width: '1px', height: '48px', background: 'linear-gradient(to bottom, transparent, #333, transparent)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.4)', animation: 'scroll-dot 2s infinite' }} />
            </div>
          </div>

          {/* Subtitle / Tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.4em', color: '#a3a3a3', textTransform: 'uppercase' }}>
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
              href="/login?view=admin"
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
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </a>

            {/* Member Card */}
            <a
              href="/login?view=member"
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
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </a>

          </div>
        </div>
      </section>

      {/* Join Modal */}
      {showJoinModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div
            onClick={() => setShowJoinModal(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          />
          <div style={{
            position: 'relative', width: '100%', maxWidth: '500px',
            background: '#0d0d0d', border: '1px solid #262626', borderRadius: '32px',
            padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <h2 className="font-display" style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>Select Your Role</h2>
              <p style={{ color: '#a3a3a3', fontSize: '14px' }}>Choose how you wish to interact with the Organization OS.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* President Option */}
              <button
                onClick={() => router.push('/signup?role=president')}
                style={{
                  width: '100%', padding: '24px', borderRadius: '20px', background: 'rgba(38,38,38,0.5)',
                  border: '1px solid #404040', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '20px',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = 'rgba(99,102,241,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#404040'; e.currentTarget.style.background = 'rgba(38,38,38,0.5)'; }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Club President</h3>
                  <p style={{ fontSize: '13px', color: '#a3a3a3' }}>Establish a new organization node and architect its domains.</p>
                </div>
              </button>

              {/* Member Option */}
              <button
                onClick={() => router.push('/signup?role=member')}
                style={{
                  width: '100%', padding: '24px', borderRadius: '20px', background: 'rgba(38,38,38,0.5)',
                  border: '1px solid #404040', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '20px',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = 'rgba(16,185,129,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#404040'; e.currentTarget.style.background = 'rgba(38,38,38,0.5)'; }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Organization Member</h3>
                  <p style={{ fontSize: '13px', color: '#a3a3a3' }}>Join an existing node and contribute to active projects.</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowJoinModal(false)}
              style={{ color: '#525252', fontSize: '12px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'center', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#525252')}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
