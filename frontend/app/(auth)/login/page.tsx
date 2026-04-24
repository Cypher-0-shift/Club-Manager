'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { useAppStore } from '@/lib/store';
import { User } from '@/types';
import { useEffect, useRef } from 'react';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password required'),
});
type FormData = z.infer<typeof schema>;

import { Suspense } from 'react';

function LoginContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { setUser } = useAppStore();
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') === 'member' ? 'member' : 'admin';
  const [view, setView] = useState<'admin' | 'member'>(initialView);
  const [showPw, setShowPw] = useState(false);
  const particlesRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;
    container.innerHTML = ''; // Clear existing
    for (let i = 0; i < 140; i++) {
      const p = document.createElement('div');
      p.className = 'sparkle';
      const size = Math.random() * 2 + 1;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.setProperty('--duration', `${Math.random() * 3 + 2}s`);
      p.style.animationDelay = `${Math.random() * 5}s`;
      container.appendChild(p);
    }
  }, []);

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const { error, data: authData } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
      if (error) throw error;
      const { data: userRow, error: userErr } = await supabase.from('users').select('*').eq('id', authData.user!.id).single();
      if (userErr) throw userErr;
      if (!userRow.is_approved) { await supabase.auth.signOut(); router.push('/pending-approval'); return; }
      setUser(userRow as User);
      toast('Welcome back!', 'success');
      router.push('/dashboard');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = view === 'admin';

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', overflow: 'hidden', position: 'relative', fontFamily: 'Satoshi, sans-serif' }}>
      {/* Particles */}
      <div ref={particlesRef} className="mask-radial" style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.3, pointerEvents: 'none' }} />

      {/* Ambient glows */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '600px', height: '600px', background: 'rgba(14,165,233,0.10)', filter: 'blur(120px)', borderRadius: '50%', transform: 'translate(50%, -50%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '600px', height: '600px', background: 'rgba(99,102,241,0.10)', filter: 'blur(120px)', borderRadius: '50%', transform: 'translate(-50%, 50%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50, padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="font-display" style={{ fontSize: '18px', fontWeight: 700 }}>Club Manager</span>
        </div>
        <button
          onClick={() => router.push('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a3a3a3', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Back to Home
        </button>
      </nav>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative', zIndex: 10, padding: '16px' }}>
        <div style={{ width: '100%', maxWidth: '448px' }}>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 className="font-display" style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '8px' }}>
              {isAdmin ? 'Welcome Back' : 'Member Access'}
            </h1>
          </div>

          {/* Glass card */}
          <div style={{ background: 'rgba(23,23,23,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '40px', padding: '40px', position: 'relative' }}>
            {/* Top accent line */}
            <div style={{ position: 'absolute', top: '-1px', left: '48px', right: '48px', height: '1px', background: 'linear-gradient(to right, transparent, #0ea5e9, transparent)' }} />

            {/* Role toggle */}
            <div style={{ display: 'flex', padding: '4px', background: 'rgba(10,10,10,0.5)', borderRadius: '16px', marginBottom: '40px', border: '1px solid rgba(38,38,38,0.5)' }}>
              {(['member', 'admin'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setView(r)}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '12px',
                    fontSize: '10px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase',
                    cursor: 'pointer', border: 'none', transition: 'all 0.3s',
                    background: view === r ? '#fff' : 'transparent',
                    color: view === r ? '#000' : '#525252',
                    boxShadow: view === r ? '0 0 20px rgba(255,255,255,0.1)' : 'none',
                  }}
                >
                  {r === 'member' ? 'Member Login' : 'Admin Login'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.2em', marginLeft: '4px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#525252', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <input
                    {...register('email')}
                    type="email"
                    id="login-email"
                    placeholder="id@clubmanager.org"
                    style={{
                      width: '100%', background: 'rgba(10,10,10,0.5)', border: '1px solid #262626',
                      borderRadius: '16px', padding: '16px 16px 16px 48px',
                      fontSize: '14px', color: '#fff', outline: 'none', transition: 'all 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#0ea5e9'; e.target.style.boxShadow = '0 0 15px rgba(14,165,233,0.15)'; }}
                    onBlur={e => { e.target.style.borderColor = '#262626'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                {errors.email && <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.email.message}</span>}
              </div>
 
              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginLeft: '4px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Password</label>
                </div>
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#525252', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    {...register('password')}
                    type={showPw ? 'text' : 'password'}
                    id="login-password"
                    placeholder="••••••••••••"
                    style={{
                      width: '100%', background: 'rgba(10,10,10,0.5)', border: '1px solid #262626',
                      borderRadius: '16px', padding: '16px 48px 16px 48px',
                      fontSize: '14px', color: '#fff', outline: 'none', transition: 'all 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#0ea5e9'; e.target.style.boxShadow = '0 0 15px rgba(14,165,233,0.15)'; }}
                    onBlur={e => { e.target.style.borderColor = '#262626'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    id="toggle-password"
                    onClick={() => setShowPw(s => !s)}
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#525252', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {showPw ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                {errors.password && <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.password.message}</span>}
              </div>

              {/* Remember */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '4px' }}>
                <input type="checkbox" id="remember-me" style={{ width: '16px', height: '16px', borderRadius: '4px', accentColor: '#0ea5e9' }} />
                <label htmlFor="remember-me" style={{ fontSize: '12px', color: '#a3a3a3', cursor: 'pointer' }}>Keep session active</label>
              </div>

              {/* Submit */}
              <button
                id="signin-btn"
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', background: '#fff', color: '#000', padding: '16px',
                  borderRadius: '16px', fontSize: '10px', fontWeight: 900, letterSpacing: '0.2em',
                  textTransform: 'uppercase', border: '1px solid #fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                  transition: 'all 0.2s', opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = '0 0 30px rgba(255,255,255,0.2)'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {loading ? 'Signing in…' : 'Sign In to Terminal'}
                {!loading && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                  </svg>
                )}
              </button>
            </form>

            {/* Footer */}
            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(38,38,38,0.5)', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#a3a3a3' }}>
                New organization?{' '}
                <a href="/signup" id="signup-link" style={{ color: '#fff', fontWeight: 700, letterSpacing: '-0.02em', textDecoration: 'none', textTransform: 'uppercase' }}>Create Account</a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
