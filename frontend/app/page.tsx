'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useEffect } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const { role } = useAppStore();

  // If already logged in, redirect
  useEffect(() => {
    if (role) router.push('/dashboard');
  }, [role, router]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* Gradient mesh background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: '800px', height: '800px',
          borderRadius: '50%', top: '-200px', left: '-200px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', width: '600px', height: '600px',
          borderRadius: '50%', bottom: '-100px', right: '-100px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', width: '400px', height: '400px',
          borderRadius: '50%', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
        }} />
      </div>

      {/* Nav */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'var(--color-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 700, color: '#fff',
          }}>C</div>
          <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-text-primary)' }}>
            Club Task Manager
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href="/login" className="btn btn-ghost btn-sm">Sign In</a>
          <a href="/signup" className="btn btn-primary btn-sm">Request Access</a>
        </div>
      </nav>

      {/* Hero */}
      <main style={{
        flex: 1, position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '80px 24px 40px', textAlign: 'center',
      }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '5px 14px', borderRadius: '999px', marginBottom: '24px',
          background: 'var(--color-brand-subtle)',
          border: '1px solid rgba(99,102,241,0.25)',
          fontSize: '12px', fontWeight: 600, color: 'var(--color-brand)',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          <span>●</span> Now in Beta
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 700, lineHeight: 1.1,
          color: 'var(--color-text-primary)',
          maxWidth: '800px', marginBottom: '20px',
        }}>
          Organize. Assign.{' '}
          <span style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Deliver.</span>
        </h1>

        <p style={{
          fontSize: '18px', color: 'var(--color-text-secondary)',
          maxWidth: '560px', lineHeight: 1.7, marginBottom: '60px',
        }}>
          A full-featured task management system built for clubs and organizations.
          Role-based access, real-time Kanban boards, and proof-of-work submissions.
        </p>

        {/* Role selector cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          maxWidth: '740px',
          width: '100%',
          marginBottom: '80px',
        }}>

          {/* Admin Card */}
          <button
            id="enter-admin"
            onClick={() => router.push('/login')}
            style={{
              background: 'rgba(22, 27, 39, 0.8)',
              border: '1px solid rgba(99,102,241,0.35)',
              borderRadius: '16px',
              padding: '32px 28px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(12px)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.7)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 20px 60px rgba(99,102,241,0.2)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.35)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            {/* Glow */}
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: '120px', height: '120px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)',
              transform: 'translate(30px, -30px)',
            }} />

            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #4f52e0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', marginBottom: '16px',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            }}>
              👑
            </div>

            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              Admin Panel
            </div>
            <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              For Presidents, VPs, Leads & Secretaries. Manage domains, approve members, assign tasks, and track progress across the entire club.
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Manage Users','Create Domains','Assign Tasks','Analytics'].map(tag => (
                <span key={tag} style={{
                  fontSize: '11px', fontWeight: 500,
                  padding: '3px 10px', borderRadius: '999px',
                  background: 'rgba(99,102,241,0.12)',
                  color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)',
                }}>{tag}</span>
              ))}
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              marginTop: '20px', color: 'var(--color-brand)',
              fontSize: '14px', fontWeight: 600,
            }}>
              Enter Admin Panel <span>→</span>
            </div>
          </button>

          {/* Member Card */}
          <button
            id="enter-member"
            onClick={() => router.push('/login')}
            style={{
              background: 'rgba(22, 27, 39, 0.8)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: '16px',
              padding: '32px 28px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(12px)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(34,197,94,0.6)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 20px 60px rgba(34,197,94,0.15)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(34,197,94,0.25)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            {/* Glow */}
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: '120px', height: '120px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(34,197,94,0.12), transparent 70%)',
              transform: 'translate(30px, -30px)',
            }} />

            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', marginBottom: '16px',
              boxShadow: '0 4px 16px rgba(34,197,94,0.35)',
            }}>
              ⚡
            </div>

            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              Member Panel
            </div>
            <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              For club members. View your assigned tasks, update progress, submit proof of work, and communicate with your team leads.
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['My Tasks','Kanban Board','Submit Work','Team Chat'].map(tag => (
                <span key={tag} style={{
                  fontSize: '11px', fontWeight: 500,
                  padding: '3px 10px', borderRadius: '999px',
                  background: 'rgba(34,197,94,0.10)',
                  color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)',
                }}>{tag}</span>
              ))}
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              marginTop: '20px', color: '#22c55e',
              fontSize: '14px', fontWeight: 600,
            }}>
              Enter Member Panel <span>→</span>
            </div>
          </button>
        </div>

        {/* Features strip */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '32px',
          marginBottom: '48px',
          maxWidth: '800px',
        }}>
          {[
            { icon: '🎯', label: 'Role-Based Access', desc: 'President → Lead → Member hierarchy' },
            { icon: '⚡', label: 'Live Kanban Board', desc: 'Drag & drop with real-time sync' },
            { icon: '📎', label: 'Proof of Work', desc: 'File, URL or text submissions' },
            { icon: '💬', label: 'Task Chat', desc: 'Per-task comment threads' },
          ].map(f => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              maxWidth: '180px', textAlign: 'left',
            }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '3px' }}>{f.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* First Time CTA */}
        <div style={{
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '800px',
          width: '100%',
          marginBottom: '48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Using it for the first time?
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', maxWidth: '400px' }}>
            Set up the entire club hierarchy by creating a president account from scratch.
          </p>
          <a href="/signup?role=president" className="btn btn-primary">
            Create a President Account
          </a>
        </div>

        {/* Footer */}
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', gap: '8px' }}>
          <span>© 2026 Club Task Manager</span>
          <span>·</span>
          <a href="/login" style={{ color: 'var(--color-brand)' }}>Sign in to continue</a>
        </div>
      </main>
    </div>
  );
}
