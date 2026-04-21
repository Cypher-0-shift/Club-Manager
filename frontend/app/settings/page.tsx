'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useAppStore } from '@/lib/store';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const { user, setUser } = useAppStore();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [newPassword, setNewPassword] = useState('');

  const updateProfile = useMutation({
    mutationFn: () => api.patch(`/users/${user?.id}`, { full_name: fullName }),
    onSuccess: (res) => { setUser(res.data); toast('Profile updated', 'success'); },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  async function handlePasswordChange() {
    if (newPassword.length < 8) { toast('Password must be at least 8 characters', 'error'); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast(error.message, 'error');
    else { toast('Password updated successfully', 'success'); setNewPassword(''); }
  }

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '520px' }}>
        <div>
          <h1 className="section-title" style={{ fontSize: '18px' }}>Settings</h1>
          <p className="section-subtitle">Manage your account preferences</p>
        </div>

        {/* Profile */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600 }}>Profile</h2>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              id="settings-name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={user?.email ?? ''} disabled style={{ opacity: 0.6 }} />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <input className="form-input" value={user?.role ?? ''} disabled style={{ opacity: 0.6, textTransform: 'capitalize' }} />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => updateProfile.mutate()}
            disabled={!fullName.trim() || updateProfile.isPending}
            id="settings-save"
          >
            {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        {/* Password */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600 }}>Change Password</h2>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
              id="settings-password"
            />
          </div>
          <button
            className="btn btn-secondary"
            onClick={handlePasswordChange}
            disabled={!newPassword}
            id="settings-change-password"
          >
            Update Password
          </button>
        </div>
      </div>
    </AppShell>
  );
}
