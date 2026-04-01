import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';
import { PrimaryButton, DangerButton } from '../components/ui/Button';
import { Loader2, User, Lock, Trash2 } from 'lucide-react';

export default function Settings() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name cannot be empty');
    setSaving(true);
    try {
      const token = localStorage.getItem('evenup_auth_token');
      const res = await fetch('http://127.0.0.1:8000/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Error ${res.status}`);
      }
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profile updated!');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwCurrent) return toast.error('Enter your current password');
    if (pwNew.length < 6) return toast.error('New password must be at least 6 characters');
    if (pwNew !== pwConfirm) return toast.error('Passwords do not match');
    setSavingPw(true);
    try {
      const token = localStorage.getItem('evenup_auth_token');
      const res = await fetch('http://127.0.0.1:8000/users/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: pwCurrent, new_password: pwNew }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to update password');
      }
      toast.success('Password updated!');
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingPw(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you sure? This will permanently delete your account and all data. This cannot be undone.');
    if (!confirmed) return;
    try {
      const token = localStorage.getItem('evenup_auth_token');
      const res = await fetch('http://127.0.0.1:8000/users/me', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete account');
      logout();
      toast.success('Account deleted.');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const avatarInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="space-y-8 pb-10 max-w-2xl">
      <div className="border-b border-border-soft pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-secondary mt-1">Manage your account and security.</p>
      </div>

      {/* Profile Section */}
      <div className="glass border border-border-soft p-8 rounded-2xl space-y-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center text-white text-2xl font-bold shadow-[0_0_20px_rgba(192,143,245,0.4)] flex-shrink-0">
            {avatarInitials}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{user?.name || 'User'}</h3>
            <p className="text-secondary text-sm">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-primary" />
            <h4 className="text-white font-semibold">Profile Information</h4>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-secondary font-medium uppercase tracking-wider">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-secondary font-medium uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-secondary cursor-not-allowed opacity-60"
            />
            <p className="text-xs text-secondary/60">Email cannot be changed.</p>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="glass border border-border-soft p-8 rounded-2xl space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-4 h-4 text-primary" />
          <h4 className="text-white font-semibold">Change Password</h4>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {[
            { label: 'Current Password', value: pwCurrent, set: setPwCurrent, complete: 'current-password' },
            { label: 'New Password', value: pwNew, set: setPwNew, complete: 'new-password' },
            { label: 'Confirm New Password', value: pwConfirm, set: setPwConfirm, complete: 'new-password' },
          ].map(f => (
            <div key={f.label} className="space-y-1.5">
              <label className="text-xs text-secondary font-medium uppercase tracking-wider">{f.label}</label>
              <input
                type="password"
                autoComplete={f.complete}
                value={f.value}
                onChange={e => f.set(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPw}
              className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition disabled:opacity-50"
            >
              {savingPw && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="glass border border-danger/30 p-8 rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-danger" />
          <h4 className="text-danger font-semibold">Danger Zone</h4>
        </div>
        <p className="text-secondary text-sm">Permanently delete your account and all associated data. This cannot be undone.</p>
        <button
          onClick={handleDeleteAccount}
          className="py-2.5 px-6 rounded-xl bg-danger/10 border border-danger/30 text-danger font-semibold hover:bg-danger/20 transition"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
