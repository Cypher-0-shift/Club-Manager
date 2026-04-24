'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  org_name: z.string().optional(),
  join_code: z.string().optional(),
  domain_id: z.string().optional(),
}).refine((data) => {
  if (data.role === 'president' && !data.org_name) return false;
  return true;
}, {
  message: "Organization name is required for President account",
  path: ["org_name"]
}).refine((data) => {
  if (data.role !== 'president' && !data.join_code) return false;
  return true;
}, {
  message: "Join code is required to join an organization",
  path: ["join_code"]
});
type FormData = z.infer<typeof schema>;

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'president', label: 'President (New Organization)' },
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
  const [showTerms, setShowTerms] = useState(false);
  const [strength, setStrength] = useState(0);
  const particlesRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();

  const { register, handleSubmit, watch, control, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: (searchParams.get('role') as UserRole) || 'member' },
  });

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ['president', 'vp', 'secretary', 'lead', 'member'].includes(roleParam)) {
      setValue('role', roleParam as UserRole);
    }
  }, [searchParams, setValue]);

  const selectedRole = watch('role');
  const password = watch('password');
  const needsDomain = !EXEC_ROLES.includes(selectedRole as UserRole);

  useEffect(() => {
    if (!password) {
      setStrength(0);
      return;
    }
    let score = 0;
    if (password.length >= 8) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    if (/[0-9]/.test(password) || /[A-Z]/.test(password)) score++;
    setStrength(score);
  }, [password]);

  const joinCode = watch('join_code');
  const { data: domains = [] } = useQuery<Domain[]>({
    queryKey: ['domains-public', joinCode],
    queryFn: () => {
      if (!joinCode || joinCode.length < 8) return Promise.resolve([]);
      return api.get(`/domains/public?join_code=${joinCode}`).then(r => r.data).catch(() => []);
    },
    enabled: !!joinCode && joinCode.length >= 8,
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
        options: { 
          data: { 
            full_name: data.full_name,
            role: 'member'
          } 
        },
      });
      if (signUpError) throw signUpError;

      // 2) insert into public.users
      const res = await api.post('/users', {
        id: authData.user!.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        org_name: data.role === 'president' ? data.org_name : null,
        join_code: data.role !== 'president' ? data.join_code : null,
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

      {/* Ambient glows */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '600px', height: '600px', background: 'rgba(14,165,233,0.10)', filter: 'blur(120px)', borderRadius: '50%', transform: 'translate(50%, -50%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '600px', height: '600px', background: 'rgba(99,102,241,0.10)', filter: 'blur(120px)', borderRadius: '50%', transform: 'translate(-50%, 50%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50, padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
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
            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
          </svg>
          Back to Site
        </button>
      </nav>

      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10, padding: '48px 16px' }}>
        <div style={{ width: '100%', maxWidth: '448px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h1 className="font-display" style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '4px', lineHeight: 1.1 }}>
              {selectedRole === 'president' ? 'Create Your\nPresident Account' : 'Join Your\nOrganization'}
            </h1>
          </div>

          {/* Form card */}
          <div style={{ width: '100%', padding: '20px', borderRadius: '20px', background: 'rgba(23,23,23,0.5)', border: '1px solid #262626', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-1px', left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.5), transparent)' }} />

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Full Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.2em', marginLeft: '4px' }}>Full Name</label>
                <input
                  {...register('full_name')}
                  id="signup-name"
                  placeholder="Rohan Sharma"
                  style={{ width: '100%', background: 'rgba(38,38,38,0.5)', border: '1px solid #404040', borderRadius: '12px', padding: '10px 14px', fontSize: '14px', color: '#fff', outline: 'none', transition: 'all 0.2s' }}
                  onFocus={e => { e.target.style.borderColor = '#0ea5e9'; e.target.style.boxShadow = '0 0 15px rgba(14,165,233,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#404040'; e.target.style.boxShadow = 'none'; }}
                />
                {errors.full_name && <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.full_name.message}</span>}
              </div>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.2em', marginLeft: '4px' }}>Email Address</label>
                <input
                  {...register('email')}
                  type="email"
                  id="signup-email"
                  placeholder="president@organization.com"
                  style={{ width: '100%', background: 'rgba(38,38,38,0.5)', border: '1px solid #404040', borderRadius: '12px', padding: '10px 14px', fontSize: '14px', color: '#fff', outline: 'none', transition: 'all 0.2s' }}
                  onFocus={e => { e.target.style.borderColor = '#0ea5e9'; e.target.style.boxShadow = '0 0 15px rgba(14,165,233,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#404040'; e.target.style.boxShadow = 'none'; }}
                />
                {errors.email && <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.email.message}</span>}
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.2em', marginLeft: '4px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    {...register('password')}
                    type={showPw ? 'text' : 'password'}
                    id="signup-password"
                    placeholder="••••••••"
                    style={{ width: '100%', background: 'rgba(38,38,38,0.5)', border: '1px solid #404040', borderRadius: '12px', padding: '10px 48px 10px 14px', fontSize: '14px', color: '#fff', outline: 'none', transition: 'all 0.2s' }}
                    onFocus={e => { e.target.style.borderColor = '#0ea5e9'; e.target.style.boxShadow = '0 0 15px rgba(14,165,233,0.15)'; }}
                    onBlur={e => { e.target.style.borderColor = '#404040'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {showPw ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                {/* Password strength */}
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  <div style={{ height: '4px', flex: 1, borderRadius: '999px', background: strength >= 1 ? '#6366f1' : '#262626', transition: 'all 0.3s' }} />
                  <div style={{ height: '4px', flex: 1, borderRadius: '999px', background: strength >= 2 ? '#6366f1' : '#262626', transition: 'all 0.3s' }} />
                  <div style={{ height: '4px', flex: 1, borderRadius: '999px', background: strength >= 3 ? '#6366f1' : '#262626', transition: 'all 0.3s' }} />
                </div>
                <p style={{ fontSize: '10px', color: '#a3a3a3', marginLeft: '4px' }}>Minimum 8 characters with one special symbol.</p>
                {errors.password && <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.password.message}</span>}
              </div>

              {/* Role */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.2em', marginLeft: '4px' }}>Role</label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      id="signup-role"
                      style={{ width: '100%', background: 'rgba(38,38,38,0.5)', border: '1px solid #404040', borderRadius: '12px', padding: '10px 14px', fontSize: '14px', color: '#fff', outline: 'none', transition: 'border-color 0.2s' }}
                    >
                      {ROLE_OPTIONS.map(r => (
                        <option key={r.value} value={r.value} style={{ background: '#262626' }}>{r.label}</option>
                      ))}
                    </select>
                  )}
                />
              </div>

              {/* Organization Name (President Only) */}
              {selectedRole === 'president' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.2em', marginLeft: '4px' }}>Organization Name</label>
                  <input
                    {...register('org_name')}
                    placeholder="e.g. Cyber Club"
                    required
                    style={{ width: '100%', background: 'rgba(38,38,38,0.5)', border: '1px solid #404040', borderRadius: '12px', padding: '10px 14px', fontSize: '14px', color: '#fff', outline: 'none', transition: 'all 0.2s' }}
                  />
                </div>
              )}

              {/* Join Code (Non-Presidents) */}
              {selectedRole !== 'president' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.2em', marginLeft: '4px' }}>Organization Join Code</label>
                  <input
                    {...register('join_code')}
                    placeholder="ENTER CODE"
                    required
                    style={{ width: '100%', background: 'rgba(38,38,38,0.5)', border: '1px solid #404040', borderRadius: '12px', padding: '10px 14px', fontSize: '14px', color: '#fff', outline: 'none', transition: 'all 0.2s', textTransform: 'uppercase' }}
                  />
                  <p style={{ fontSize: '10px', color: '#a3a3a3', marginLeft: '4px' }}>Ask your President for the 8-character code.</p>
                </div>
              )}

              {/* Domain (conditional) */}
              {needsDomain && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.2em', marginLeft: '4px' }}>Domain</label>
                  <Controller
                    name="domain_id"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        id="signup-domain"
                        style={{ width: '100%', background: 'rgba(38,38,38,0.5)', border: '1px solid #404040', borderRadius: '12px', padding: '10px 14px', fontSize: '14px', color: field.value ? '#fff' : '#525252', outline: 'none', transition: 'border-color 0.2s' }}
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
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    style={{ color: '#818cf8', textDecoration: 'underline', textUnderlineOffset: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit', fontFamily: 'inherit' }}
                  >
                    Executive Terms of Service
                  </button>{' '}
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
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                )}
              </button>
            </form>
          </div>

          <p style={{ marginTop: '16px', fontSize: '12px', color: '#a3a3a3', textAlign: 'center' }}>
            Already have an organization account?{' '}
            <a href="/login" id="link-signin" style={{ color: '#fff', fontWeight: 700, textDecoration: 'none' }}>Sign In</a>
          </p>
        </div>
      </main>

      {/* Terms Modal */}
      {showTerms && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div
            onClick={() => setShowTerms(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          />
          <div style={{
            position: 'relative', width: '100%', maxWidth: '560px', maxHeight: '80vh',
            background: '#0d0d0d', border: '1px solid #262626', borderRadius: '24px',
            padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 className="font-display" style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Terms of Service</h2>
              <button
                onClick={() => setShowTerms(false)}
                style={{ background: '#1a1a1a', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ color: '#a3a3a3', fontSize: '14px', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <section>
                <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em' }}>1. Data Sovereignty</h3>
                <p>All organizational data remains under the exclusive control of the President. Club Manager acts only as a zero-knowledge processing layer for administrative tasks and project coordination.</p>
              </section>

              <section>
                <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em' }}>2. Executive Responsibility</h3>
                <p>Presidents are responsible for the vetting and approval of all incoming members. Club Manager provides the architecture, but the executive board maintains final authority over domain access and task distribution.</p>
              </section>

              <section>
                <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em' }}>3. Privacy Protocol</h3>
                <p>Member data is encrypted at rest and in transit. No personal information is sold or shared with third-party aggregators. System logs are purged every 30 days to ensure minimal data footprint.</p>
              </section>

              <section>
                <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em' }}>4. Termination of Node</h3>
                <p>Organizations can be dissolved at any time by the President. Upon dissolution, all related task data and member associations are permanently wiped from the processing cluster.</p>
              </section>
            </div>

            <button
              onClick={() => setShowTerms(false)}
              style={{
                width: '100%', background: '#fff', color: '#000', padding: '14px',
                borderRadius: '12px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', border: 'none', cursor: 'pointer', marginTop: '8px',
              }}
            >
              Acknowledged
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
