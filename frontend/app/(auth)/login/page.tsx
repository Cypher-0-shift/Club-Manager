'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { User } from '@/types';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [view, setView] = useState<'admin' | 'member'>('admin');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      // Fetch user profile
      const { data: userRow, error: userErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user!.id)
        .single();

      if (userErr) throw userErr;

      if (!userRow.is_approved) {
        await supabase.auth.signOut();
        router.push('/pending-approval');
        return;
      }

      setUser(userRow as User);
      toast(`Welcome back to the ${userRow.role === 'member' ? 'Member' : 'Admin'} Panel!`, 'success');
      router.push('/dashboard');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  const isMember = view === 'member';

  return (
    <div className="auth-bg">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ 
          position: 'relative',
          borderTop: `4px solid ${isMember ? 'var(--color-completed)' : 'var(--color-brand)'}`
        }}
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

        {/* Panel Switcher */}
        <div style={{ 
          display: 'flex', 
          background: 'var(--color-surface-hover)', 
          padding: '4px', 
          borderRadius: '10px', 
          marginBottom: '24px',
          gap: '4px'
        }}>
          <button 
            type="button"
            onClick={() => setView('admin')}
            style={{
              flex: 1, padding: '8px', borderRadius: '7px', fontSize: '13px', fontWeight: 600,
              background: !isMember ? 'var(--color-surface)' : 'transparent',
              color: !isMember ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              boxShadow: !isMember ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Admin Panel
          </button>
          <button 
            type="button"
            onClick={() => setView('member')}
            style={{
              flex: 1, padding: '8px', borderRadius: '7px', fontSize: '13px', fontWeight: 600,
              background: isMember ? 'var(--color-surface)' : 'transparent',
              color: isMember ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              boxShadow: isMember ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Member Panel
          </button>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '44px', height: '44px',
            background: isMember ? 'var(--color-completed)' : 'var(--color-brand)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: 700, color: '#fff',
            margin: '0 auto 12px',
            transition: 'background 0.3s'
          }}>{isMember ? 'M' : 'C'}</div>
          <h1 style={{ fontSize: '20px', fontWeight: 700 }}>
            {isMember ? 'Member Workspace' : 'Club Administration'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {isMember ? 'Access your tasks and board' : 'Manage domains, users and projects'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              {...register('email')}
              type="email"
              className="form-input"
              placeholder="you@example.com"
              autoComplete="email"
              id="login-email"
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                {...register('password')}
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                autoComplete="current-password"
                id="login-password"
                style={{ paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '12px', color: 'var(--color-text-muted)',
                }}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: '4px' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          New member?{' '}
          <a href="/signup" style={{ color: 'var(--color-brand)', fontWeight: 500 }}>
            Sign Up
          </a>
        </p>
      </motion.div>
    </div>
  );
}
