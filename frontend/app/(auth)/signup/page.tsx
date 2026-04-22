'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
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

  const { register, handleSubmit, watch, control, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'member' },
  });


  const selectedRole = watch('role');
  const needsDomain = !EXEC_ROLES.includes(selectedRole as UserRole);

  const { data: domains = [] } = useQuery<Domain[]>({
    queryKey: ['domains-public'],
    queryFn: () => api.get('/domains/public').then(r => r.data).catch(() => []),
  });

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
    <div className="auth-bg">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ maxWidth: '400px', position: 'relative' }}
      >
        <button
          onClick={() => router.push('/')}
          className="btn-icon btn-ghost"
          style={{
            position: 'absolute', top: '16px', right: '16px',
            color: 'var(--color-text-muted)',
            padding: '4px',
          }}
          title="Back to home"
          type="button"
        >
          <X size={20} />
        </button>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '44px', height: '44px',
            background: 'var(--color-brand)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: 700, color: '#fff',
            margin: '0 auto 12px',
          }}>C</div>
          <h1 style={{ fontSize: '20px', fontWeight: 700 }}>
            Request Access
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Your account will be reviewed by a club officer
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input {...register('full_name')} className="form-input" placeholder="John Doe" id="signup-name" />
            {errors.full_name && <span className="form-error">{errors.full_name.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input {...register('email')} type="email" className="form-input" placeholder="you@example.com" id="signup-email" />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                {...register('password')}
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="Min 8 characters"
                id="signup-password"
                style={{ paddingRight: '42px' }}
              />
              <button type="button" onClick={() => setShowPw(s => !s)} style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '12px', color: 'var(--color-text-muted)',
              }}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>


            <div className="form-group">
              <label className="form-label">Role</label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-input" id="signup-role">
                    {ROLE_OPTIONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                )}
              />
              {errors.role && <span className="form-error">{errors.role.message}</span>}
            </div>


          {needsDomain && (
            <div className="form-group">
              <label className="form-label">Domain</label>
              <Controller
                name="domain_id"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-input" id="signup-domain">
                    <option value="">Select a domain…</option>
                    {domains.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                )}
              />
              {errors.domain_id && <span className="form-error">{errors.domain_id.message}</span>}
            </div>
          )}

          <button
            id="signup-submit"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? 'Submitting…' : 'Request Access'}
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Already approved?{' '}
          <a href="/login" style={{ color: 'var(--color-brand)', fontWeight: 500 }}>Sign in</a>
        </p>
      </motion.div>
    </div>
  );
}
