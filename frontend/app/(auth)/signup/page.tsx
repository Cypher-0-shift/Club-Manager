'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Domain, UserRole } from '@/types';

const EXEC_ROLES: UserRole[] = ['president', 'vp', 'secretary'];

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['president', 'vp', 'secretary', 'lead', 'member'] as const),
  domain_id: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'vp', label: 'Vice President' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'lead', label: 'Domain Lead' },
  { value: 'member', label: 'Member' },
];

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setUser } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const particlesRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'member' },
  });

  const selectedRole = watch('role');
  const needsDomain = !EXEC_ROLES.includes(selectedRole as UserRole);

  const { data: domains = [] } = useQuery<Domain[]>({
    queryKey: ['domains-public'],
    queryFn: () => api.get('/domains/public').then(r => r.data).catch(() => []),
  });

  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;
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
  }, []);

  async function onSubmit(data: FormData) {
    if (needsDomain && !data.domain_id) {
      toast('Please select a domain', 'error');
      return;
    }
    setLoading(true);
    try {
      // 1) create Supabase auth user
      const { error: signUpError, data: authData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.full_name } },
      });
      if (signUpError) throw signUpError;

      // 2) insert into public.users
      const res = await api.post('/users', {
        id: authData.user!.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        domain_id: needsDomain ? data.domain_id ?? null : null,
      });

      if (res.data.is_approved) {
        setUser(res.data);
        router.push('/dashboard');
        toast('Account created successfully!', 'success');
      } else {
        router.push('/pending-approval');
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Signup failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', overflowX: 'hidden', position: 'relative', fontFamily: 'Satoshi, sans-serif' }}>
      <div ref={particlesRef} className="mask-radial" style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.3, pointerEvents: 'none' }} />

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50, padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)' }}>
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
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 500, color: '#a3a3a3', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
          </svg>
          Back to Site
        </button>
      </nav>

      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10, padding: '96px 16px 48px' }}>
        <div style={{ width: '100%', maxWidth: '448px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Executive Onboarding
            </div>
            <h1 className="font-display" style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '8px', lineHeight: 1.1 }}>
              Create Your<br/>President Account
            </h1>
            <p style={{ color: '#a3a3a3', fontSize: '12px', lineHeight: 1.6, maxWidth: '280px', margin: '0 auto' }}>
              Gain architect-level access to orchestrate domains and approve global talent.
            </p>
          </div>

          {/* Form card */}
          <div style={{ width: '100%', padding: '24px', borderRadius: '24px', background: 'rgba(23,23,23,0.5)', border: '1px solid #262626', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-1px', left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.5), transparent)' }} />

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Full Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.2em', marginLeft: '4px' }}>Full Name</label>
                <input
                  {...register('full_name')}
                  id="signup-name"
                  placeholder="John Doe"
                  style={{ width: '100%', background: 'rgba(38,38,38,0.5)', border: '1px solid #404040', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: '#fff', outline: 'none', transition: 'all 0.2s' }}
                  onFocus={e => { e.target.style.borderColor = '#0ea5e9'; e.target.style.boxShadow = '0 0 15px rgba(14,165,233,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#404040'; e.target.style.boxShadow = 'none'; }}
                />
                {errors.full_name && <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.full_name.message}</span>}
              </div>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.2em', marginLeft: '4px' }}>Email Address</label>
                <input
                  {...register('email')}
                  type="email"
                  id="signup-email"
                  placeholder="president@organization.com"
                  style={{ width: '100%', background: 'rgba(38,38,38,0.5)', border: '1px solid #404040', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: '#fff', outline: 'none', transition: 'all 0.2s' }}
                  onFocus={e => { e.target.style.borderColor = '#0ea5e9'; e.target.style.boxShadow = '0 0 15px rgba(14,165,233,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#404040'; e.target.style.boxShadow = 'none'; }}
                />
                {errors.email && <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.email.message}</span>}
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.2em', marginLeft: '4px' }}>Create Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    {...register('password')}
                    type={showPw ? 'text' : 'password'}
                    id="signup-password"
                    placeholder="••••••••"
                    style={{ width: '100%', background: 'rgba(38,38,38,0.5)', border: '1px solid #404040', borderRadius: '12px', padding: '12px 48px 12px 16px', fontSize: '14px', color: '#fff', outline: 'none', transition: 'all 0.2s' }}
                    onFocus={e => { e.target.style.borderColor = '#0ea5e9'; e.target.style.boxShadow = '0 0 15px rgba(14,165,233,0.15)'; }}
                    onBlur={e => { e.target.style.borderColor = '#404040'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#525252', background: 'none', border: 'none', cursor: 'pointer' }}
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
                {/* Password strength */}
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  <div style={{ height: '4px', flex: 1, borderRadius: '999px', background: '#262626' }}>
                    <div style={{ height: '100%', width: '33%', borderRadius: '999px', background: '#6366f1' }} />
                  </div>
                  <div style={{ height: '4px', flex: 1, borderRadius: '999px', background: '#262626' }} />
                  <div style={{ height: '4px', flex: 1, borderRadius: '999px', background: '#262626' }} />
                </div>
                <p style={{ fontSize: '10px', color: '#525252', marginLeft: '4px' }}>Minimum 8 characters with one special symbol.</p>
                {errors.password && <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.password.message}</span>}
              </div>

              {/* Role */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.2em', marginLeft: '4px' }}>Role</label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      id="signup-role"
                      style={{ width: '100%', background: 'rgba(38,38,38,0.5)', border: '1px solid #404040', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: '#fff', outline: 'none', transition: 'border-color 0.2s' }}
                    >
                      {ROLE_OPTIONS.map(r => (
                        <option key={r.value} value={r.value} style={{ background: '#262626' }}>{r.label}</option>
                      ))}
                    </select>
                  )}
                />
              </div>

              {/* Domain (conditional) */}
              {needsDomain && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.2em', marginLeft: '4px' }}>Domain</label>
                  <Controller
                    name="domain_id"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        id="signup-domain"
                        style={{ width: '100%', background: 'rgba(38,38,38,0.5)', border: '1px solid #404040', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: field.value ? '#fff' : '#525252', outline: 'none', transition: 'border-color 0.2s' }}
                      >
                        <option value="" style={{ background: '#262626' }}>Select a domain…</option>
                        {domains.map(d => (
                          <option key={d.id} value={d.id} style={{ background: '#262626' }}>{d.name}</option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.domain_id && <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.domain_id.message}</span>}
                </div>
              )}

              {/* Terms */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <input
                  type="checkbox"
                  id="terms"
                  required
                  style={{ width: '16px', height: '16px', marginTop: '2px', borderRadius: '4px', accentColor: '#6366f1', flexShrink: 0 }}
                />
                <label htmlFor="terms" style={{ fontSize: '12px', color: '#a3a3a3', lineHeight: 1.5, cursor: 'pointer' }}>
                  I agree to the{' '}
                  <a href="#" style={{ color: '#818cf8', textDecoration: 'underline', textUnderlineOffset: '4px' }}>Executive Terms of Service</a>{' '}
                  and Privacy Protocol.
                </label>
              </div>

              {/* Submit */}
              <button
                id="signup-submit"
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', background: '#fff', color: '#000', padding: '16px',
                  borderRadius: '12px', fontSize: '14px', fontWeight: 700, letterSpacing: '0.2em',
                  textTransform: 'uppercase', border: '1px solid #fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                  transition: 'all 0.2s', opacity: loading ? 0.6 : 1, marginTop: '4px',
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = '0 0 30px rgba(255,255,255,0.3)'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {loading ? 'Submitting…' : 'Create Account'}
                {!loading && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                )}
              </button>
            </form>
          </div>

          <p style={{ marginTop: '24px', fontSize: '12px', color: '#525252', textAlign: 'center' }}>
            Already have an executive ID?{' '}
            <a href="/login" id="link-signin" style={{ color: '#fff', fontWeight: 700, textDecoration: 'none' }}>Sign In</a>
          </p>
        </div>
      </main>

      {/* Fixed footer */}
      <footer style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, letterSpacing: '0.3em', color: '#404040', textTransform: 'uppercase', zIndex: 20 }}>
        <div>© 2026 Club Manager Systems</div>
        <div style={{ display: 'flex', gap: '32px' }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Legal</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Security</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>System Status</a>
        </div>
      </footer>
    </div>
  );
}
