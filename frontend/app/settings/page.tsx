'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useAppStore } from '@/lib/store';
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { AlertTriangle, Trash2, ShieldAlert, Check, X, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';

export default function SettingsPage() {
  const { hydrated } = useAuthHydration();
  const { user, setUser, clearUser } = useAppStore();
  const { toast } = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [newPassword, setNewPassword] = useState('');
  
  // Transfer state
  const [selectedNewPresident, setSelectedNewPresident] = useState('');
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  
  // Nuke state
  const [showNukeConfirm1, setShowNukeConfirm1] = useState(false);
  const [showNukeConfirm2, setShowNukeConfirm2] = useState(false);
  const [nukeConfirmText, setNukeConfirmText] = useState('');

  // Member Deletion Request state
  const [showDeleteRequestConfirm, setShowDeleteRequestConfirm] = useState(false);

  // Sync state if user is loaded later
  useEffect(() => {
    if (user?.full_name) {
      setFullName(user.full_name);
    }
  }, [user]);

  const { data: eligibleUsers = [] } = useQuery<User[]>({
    queryKey: ['eligible-presidents'],
    queryFn: () => api.get('/users?is_approved=true').then(r => r.data),
    enabled: user?.role === 'president',
  });

  const updateProfile = useMutation({
    mutationFn: () => api.patch(`/users/${user?.id}`, { full_name: fullName }),
    onSuccess: (res) => { setUser(res.data); toast('Profile updated', 'success'); },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const transferOwnership = useMutation({
    mutationFn: () => api.post(`/users/transfer-ownership?target_user_id=${selectedNewPresident}`, {}),
    onSuccess: () => {
      toast('Ownership transferred. You are now a VP.', 'success');
      setShowTransferConfirm(false);
      qc.invalidateQueries({ queryKey: ['users/me'] });
      router.push('/dashboard');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const nukeOrganization = useMutation({
    mutationFn: () => api.delete('/users/nuke'),
    onSuccess: () => {
      toast('Organization deleted. Logging out...', 'info');
      localStorage.removeItem('ctm-auth');
      clearUser();
      router.push('/login');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const requestDeletion = useMutation({
    mutationFn: () => api.post('/users/request-deletion', {}),
    onSuccess: () => {
      toast('Deletion request sent to President', 'success');
      setShowDeleteRequestConfirm(false);
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  async function handlePasswordChange() {
    if (newPassword.length < 8) { toast('Password must be at least 8 characters', 'error'); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast(error.message, 'error');
    else { toast('Password updated successfully', 'success'); setNewPassword(''); }
  }

  if (!hydrated) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--color-bg)',
      }}>
        <div className="spinner" />
      </div>
    );
  }

  const isPresident = user?.role === 'president';

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px', margin: '0 auto', padding: '20px 0' }}>
        <div>
          <h1 className="section-title" style={{ fontSize: '24px', marginBottom: '4px' }}>Settings</h1>
          <p style={{ color: '#737373', fontSize: '14px' }}>Manage your account and organization preferences</p>
        </div>

        {/* Profile */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <UserIcon size={20} color="#a3a3a3" />
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Profile Information</h2>
          </div>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" value={user?.email ?? ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
          </div>
          
          <button
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => updateProfile.mutate()}
            disabled={!fullName.trim() || updateProfile.isPending}
          >
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Password */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Security</h2>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />
          </div>
          <button
            className="btn btn-secondary"
            style={{ alignSelf: 'flex-start' }}
            onClick={handlePasswordChange}
            disabled={!newPassword || newPassword.length < 8}
          >
            Update Password
          </button>
        </div>

        {isPresident ? (
          <>
            {/* Ownership Transfer */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldAlert size={20} color="var(--color-primary)" />
                <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Transfer Ownership</h2>
              </div>
              <p style={{ fontSize: '13px', color: '#737373', lineHeight: 1.5 }}>
                Transfer the President role to another approved member. This action will demote your account to VP and cannot be undone.
              </p>
              
              <div className="form-group">
                <label className="form-label">Select New President</label>
                <select 
                  className="form-input" 
                  value={selectedNewPresident} 
                  onChange={e => setSelectedNewPresident(e.target.value)}
                  style={{ background: '#0a0a0a' }}
                >
                  <option value="">Select a member...</option>
                  {eligibleUsers.filter(u => u.id !== user?.id).map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <button
                className="btn"
                style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(99, 102, 241, 0.2)', alignSelf: 'flex-start' }}
                onClick={() => setShowTransferConfirm(true)}
                disabled={!selectedNewPresident}
              >
                Transfer Ownership
              </button>
            </div>

            {/* Danger Zone */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid rgba(220, 38, 38, 0.2)', background: 'rgba(220, 38, 38, 0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Trash2 size={20} color="var(--color-critical)" />
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-critical)' }}>Danger Zone</h2>
              </div>
              <p style={{ fontSize: '13px', color: '#737373', lineHeight: 1.5 }}>
                Deleting the President account will permanently dissolve the entire organization. All domains, projects, tasks, and member data will be wiped. **This is irreversible.**
              </p>
              
              <button
                className="btn btn-danger"
                style={{ alignSelf: 'flex-start' }}
                onClick={() => setShowNukeConfirm1(true)}
              >
                Delete Organization
              </button>
            </div>
          </>
        ) : (
          /* Member Account Deletion Request */
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid rgba(220, 38, 38, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Trash2 size={20} color="var(--color-critical)" />
              <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Account Deletion</h2>
            </div>
            <p style={{ fontSize: '13px', color: '#737373', lineHeight: 1.5 }}>
              If you wish to delete your account, your request will be sent to the President for final confirmation and data cleanup.
            </p>
            <button
              className="btn btn-danger"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => setShowDeleteRequestConfirm(true)}
            >
              Request Account Deletion
            </button>
          </div>
        )}

        {/* Modals */}
        {showTransferConfirm && (
          <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', justifyContent: 'center', alignItems: 'center' }}>
            <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ margin: '0 auto', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={32} color="var(--color-primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Confirm Ownership Transfer</h3>
                <p style={{ fontSize: '14px', color: '#737373', lineHeight: 1.6 }}>
                  Are you sure you want to transfer leadership to <strong>{eligibleUsers.find(u => u.id === selectedNewPresident)?.full_name}</strong>? This action will take effect immediately.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary btn-full" onClick={() => setShowTransferConfirm(false)}>Cancel</button>
                <button className="btn btn-primary btn-full" onClick={() => transferOwnership.mutate()}>Confirm Transfer</button>
              </div>
            </div>
          </div>
        )}

        {showDeleteRequestConfirm && (
          <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', justifyContent: 'center', alignItems: 'center' }}>
            <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ margin: '0 auto', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={32} color="var(--color-critical)" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Request Deletion?</h3>
                <p style={{ fontSize: '14px', color: '#737373', lineHeight: 1.6 }}>
                  This will send a formal request to the President to delete your account. You will be notified once the process is complete.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary btn-full" onClick={() => setShowDeleteRequestConfirm(false)}>Cancel</button>
                <button className="btn btn-danger btn-full" onClick={() => requestDeletion.mutate()} disabled={requestDeletion.isPending}>
                  {requestDeletion.isPending ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showNukeConfirm1 && (
          <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', justifyContent: 'center', alignItems: 'center' }}>
            <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ margin: '0 auto', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={32} color="var(--color-critical)" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Delete Everything?</h3>
                <p style={{ fontSize: '14px', color: '#737373', lineHeight: 1.6 }}>
                  This is the first step of the deletion process. You are about to wipe all data related to this organization.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary btn-full" onClick={() => setShowNukeConfirm1(false)}>Go Back</button>
                <button className="btn btn-danger btn-full" onClick={() => { setShowNukeConfirm1(false); setShowNukeConfirm2(true); }}>Next Step</button>
              </div>
            </div>
          </div>
        )}

        {showNukeConfirm2 && (
          <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(12px)', justifyContent: 'center', alignItems: 'center' }}>
            <div className="card" style={{ maxWidth: '450px', width: '90%', padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px', border: '1px solid var(--color-critical)' }}>
              <div style={{ margin: '0 auto', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-critical)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={32} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: 'var(--color-critical)' }}>Final Confirmation</h3>
                <p style={{ fontSize: '14px', color: '#a3a3a3', lineHeight: 1.6, marginBottom: '20px' }}>
                  To confirm deletion, please type <strong>DELETE MY ORGANIZATION</strong> in the box below. All data will be lost forever.
                </p>
                <input 
                  className="form-input" 
                  value={nukeConfirmText} 
                  onChange={e => setNukeConfirmText(e.target.value)}
                  placeholder="Type the confirmation text"
                  style={{ border: '1px solid rgba(220, 38, 38, 0.3)', textAlign: 'center', fontWeight: 600 }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary btn-full" onClick={() => { setShowNukeConfirm2(false); setNukeConfirmText(''); }}>Cancel</button>
                <button 
                  className="btn btn-danger btn-full" 
                  disabled={nukeConfirmText !== 'DELETE MY ORGANIZATION' || nukeOrganization.isPending}
                  onClick={() => nukeOrganization.mutate()}
                >
                  {nukeOrganization.isPending ? 'Wiping Data...' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
