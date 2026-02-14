'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient as createClient } from '@/lib/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import { Settings, CheckCircle, AlertCircle, Pencil, Shield, Lock, Sun, Moon, Monitor, Bell, Loader2, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', bio: '', avatar: '' });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [language, setLanguage] = useState('English (US)');
  const [timezone, setTimezone] = useState('GMT+01:00, West Africa Time');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setProfile({
          firstName: user.user_metadata?.first_name || '',
          lastName: user.user_metadata?.last_name || '',
          email: user.email || '',
          bio: user.user_metadata?.bio || '',
          avatar: user.user_metadata?.avatar_url || '',
        });
      }
    } catch (err) { console.error('Error fetching profile:', err); }
  };

  const handleSaveProfile = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const supabase = await createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { first_name: profile.firstName, last_name: profile.lastName, bio: profile.bio },
      });
      if (updateError) throw updateError;
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      alert('Account deletion would be processed here');
    }
  };

  const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none focus:border-primary-500 transition-colors';

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${on ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-primary-500" />
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">Settings</h1>
        </div>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Manage your account, preferences, and security</p>
      </div>

      {/* Alerts */}
      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4" />{success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      {/* Profile */}
      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
        <h2 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Profile</h2>
        <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-5">Manage your public-facing details</p>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                <span className="text-primary-500 text-lg font-bold">{profile.firstName?.[0]}{profile.lastName?.[0]}</span>
              </div>
            )}
            <button className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
              <Pencil className="w-3 h-3 text-white" />
            </button>
          </div>
          <div>
            <button className="btn-primary text-xs px-3 py-1.5">Change Photo</button>
            <button className="ml-2 text-xs text-light-text-tertiary dark:text-dark-text-tertiary hover:text-light-text-primary dark:hover:text-dark-text-primary">Remove</button>
            <p className="text-[10px] text-light-text-tertiary dark:text-dark-text-tertiary mt-1">JPG, PNG. Max 2MB. 300×300px min.</p>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Full Name</label>
            <input type="text" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className={inputCls} placeholder="Your name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Email</label>
            <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className={inputCls} placeholder="you@example.com" />
          </div>
        </div>
        <div className="mb-5">
          <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Bio</label>
          <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} className={`${inputCls} resize-none`} placeholder="A brief description..." />
        </div>
        <button onClick={handleSaveProfile} disabled={loading} className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-50">
          {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Save Changes'}
        </button>
      </div>

      {/* Security */}
      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
        <h2 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Security</h2>
        <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-5">Password and authentication</p>

        {/* 2FA */}
        <div className="pb-4 mb-4 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-500" />
              <div>
                <h3 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">Two-Factor Authentication</h3>
                <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">Extra security layer</p>
              </div>
            </div>
            <Toggle on={twoFactorEnabled} onToggle={() => setTwoFactorEnabled(!twoFactorEnabled)} />
          </div>
          {twoFactorEnabled && (
            <div className="mt-3 p-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> 2FA is enabled</p>
            </div>
          )}
        </div>

        {/* Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-yellow-500" />
            <div>
              <h3 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">Password</h3>
              <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">Change your account password</p>
            </div>
          </div>
          <button onClick={() => setShowPasswordChange(!showPasswordChange)} className="btn-secondary text-xs px-3 py-1.5">
            {showPasswordChange ? 'Cancel' : 'Change'}
          </button>
        </div>
        {showPasswordChange && (
          <div className="space-y-3 mt-4 pt-4 border-t border-light-border dark:border-dark-border">
            <input type="password" placeholder="Current password" className={inputCls} />
            <input type="password" placeholder="New password" className={inputCls} />
            <input type="password" placeholder="Confirm new password" className={inputCls} />
            <button className="btn-primary text-sm px-4 py-2">Update Password</button>
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
        <h2 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Preferences</h2>
        <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-5">Customize your experience</p>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputCls}>
              <option>English (US)</option><option>English (UK)</option><option>French</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Timezone</label>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputCls}>
              <option>GMT+01:00, West Africa Time</option><option>GMT+00:00, Greenwich Mean Time</option><option>GMT-05:00, Eastern Standard Time</option>
            </select>
          </div>
        </div>

        {/* Theme */}
        <div className="mb-5 pb-5 border-b border-light-border dark:border-dark-border">
          <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">Theme</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'light' as const, label: 'Light', Icon: Sun, iconColor: 'text-yellow-500' },
              { value: 'dark' as const, label: 'Dark', Icon: Moon, iconColor: 'text-blue-400' },
              { value: 'system' as const, label: 'System', Icon: Monitor, iconColor: 'text-light-text-tertiary dark:text-dark-text-tertiary' },
            ]).map((t) => (
              <button key={t.value} onClick={() => setTheme(t.value)}
                className={`py-2.5 rounded-lg border-2 transition-all flex items-center justify-center gap-2 text-sm ${
                  theme === t.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background hover:border-primary-500/30'
                }`}>
                <t.Icon className={`w-4 h-4 ${t.iconColor}`} />
                <span className="font-medium text-light-text-primary dark:text-dark-text-primary">{t.label}</span>
                {theme === t.value && <CheckCircle className="w-3 h-3 text-primary-500" />}
              </button>
            ))}
          </div>
        </div>

        {/* Notification toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">Push Notifications</h3>
              <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">Deadline and activity alerts</p>
            </div>
            <Toggle on={notificationsEnabled} onToggle={() => setNotificationsEnabled(!notificationsEnabled)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">Marketing Emails</h3>
              <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">Product updates and offers</p>
            </div>
            <Toggle on={marketingEmails} onToggle={() => setMarketingEmails(!marketingEmails)} />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-5 rounded-xl border-2 border-red-200 dark:border-red-800/30 bg-light-surface dark:bg-dark-surface">
        <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Danger Zone</h2>
        <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-4">Irreversible actions</p>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">Delete Account</h3>
            <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">Permanently remove your account and all data</p>
          </div>
          <button onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1">
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
