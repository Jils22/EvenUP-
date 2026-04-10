import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';
import { PrimaryButton, DangerButton } from '../components/ui/Button';
import { Loader2, User, Lock, Trash2, Palette } from 'lucide-react';
import { useTheme, AppTheme } from '../context/ThemeContext';

export default function Settings() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { theme, setTheme } = useTheme();

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
      await apiClient.patch('/users/me', { name: name.trim() });
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
      await apiClient.patch('/users/me/password', { 
        current_password: pwCurrent, 
        new_password: pwNew 
      });
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
      await apiClient.delete('/users/me');
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

      {/* Visual Workspace & Theming */}
      <div className="glass border border-border-soft p-8 rounded-2xl space-y-6">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-4 h-4 text-primary" />
          <h4 className="text-white font-semibold">Visual Workspace</h4>
        </div>
        <p className="text-secondary text-sm font-medium">Choose a theme that matches your financial style.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { id: 'midnight', name: 'Midnight', colors: ['#091428', '#C08FF5'] },
            { id: 'cyberpunk', name: 'Cyberpunk', colors: ['#0D0221', '#00FFCC'] },
            { id: 'gold', name: 'Luxury Gold', colors: ['#0F0F0F', '#D4AF37'] },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id as AppTheme)}
              className={`relative overflow-hidden group p-4 rounded-xl border transition-all text-left ${
                theme === t.id 
                  ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(192,143,245,0.2)]' 
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex gap-1 shrink-0">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.colors[0] }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.colors[1] }} />
                </div>
                <span className={`text-sm font-bold ${theme === t.id ? 'text-white' : 'text-secondary'}`}>{t.name}</span>
              </div>
              
              <div className="space-y-1.5 opacity-40">
                <div className="h-1 w-full bg-white/20 rounded-full" />
                <div className="h-1 w-2/3 bg-white/20 rounded-full" />
              </div>

              {theme === t.id && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>
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
