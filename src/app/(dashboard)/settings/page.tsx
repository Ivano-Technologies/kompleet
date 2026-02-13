'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient as createClient } from '@/lib/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Profile state
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    avatar: '',
  });

  // Security state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // Preferences
  const [language, setLanguage] = useState('English (US)');
  const [timezone, setTimezone] = useState('GMT+01:00, Central European Time');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

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
    } catch (err: any) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const supabase = await createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: profile.firstName,
          last_name: profile.lastName,
          bio: profile.bio,
        }
      });

      if (updateError) throw updateError;
      
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      // Implement account deletion logic
      alert('Account deletion would be processed here');
    }
  };

  // Theme classes now use Tailwind dark: variants

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      {/* Header */}
      <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border border-b px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">Settings</h1>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">
              Manage your account information and preferences
            </p>
          </div>
          <button className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary hover:border-primary-500 transition-colors">
            <span className="material-icons text-sm">notifications</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-success-500/10 border border-success-500/20 rounded-lg text-success-500 flex items-center gap-3">
            <span className="material-icons">check_circle</span>
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-error-500/10 border border-error-500/20 rounded-lg text-error-500 flex items-center gap-3">
            <span className="material-icons">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Profile Settings */}
        <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-8 mb-6">
          <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">Profile Settings</h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm mb-8">
            Manage your profile and public-facing details
          </p>

          {/* Profile Picture */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              PROFILE PICTURE
            </label>
            <div className="flex items-center gap-6">
              <div className="relative">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary-500/10 flex items-center justify-center">
                    <span className="text-primary-500 text-3xl font-bold">
                      {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </span>
                  </div>
                )}
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                  <span className="material-icons text-white text-sm">edit</span>
                </button>
              </div>
              <div>
                <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
                  Change Photo
                </button>
                <button className="ml-3 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary text-sm font-medium transition-colors">
                  Remove
                </button>
                <p className="text-light-text-tertiary dark:text-dark-text-tertiary text-xs mt-2">
                  JPG, GIF or PNG. Max size of 2MB. Min 300 x 300 px / 1:1 ratio
                </p>
              </div>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                className="w-full bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 transition-colors"
                placeholder="Alexander"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 transition-colors"
                placeholder="alexander.t@kompleet.tax"
              />
              <p className="text-light-text-tertiary dark:text-dark-text-tertiary text-xs mt-2">
                Email provided by Supabase. Custom domains are not supported.
              </p>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">              Bio
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={4}
              className={`w-full ${inputClass} border rounded-lg px-4 py-3 focus:outline-none transition-colors resize-none`}
              placeholder="Product Designer based in Tokyo. Experienced in high-performance web interfaces and design systems."
            />
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={loading}
            className="bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Security Settings */}
        <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-8 mb-6">
          <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">Security Settings</h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm mb-8">
            Manage your password and authentication methods
          </p>

          {/* Two-Factor Authentication */}
          <div className="mb-8 pb-8 border-b border-dark-border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-icons text-primary-500">security</span>
                  <h3 className={`font-semibold ${textPrimaryClass}`}>TWO-FACTOR AUTHENTICATION</h3>
                </div>
                <p className={`${textSecondaryClass} text-sm`}>
                  Add an extra layer of security to your account
                </p>
              </div>
              <button
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  twoFactorEnabled ? 'bg-primary-500' : 'bg-light-border dark:bg-dark-border'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    twoFactorEnabled ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            {twoFactorEnabled && (
              <div className="mt-4 p-4 bg-success-500/10 border border-success-500/20 rounded-lg">
                <p className={`text-success-500 text-sm flex items-center gap-2`}>
                  <span className="material-icons text-sm">check_circle</span>
                  2FA is currently enabled on your account
                </p>
              </div>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-icons text-warning-500">lock</span>
                  <h3 className={`font-semibold ${textPrimaryClass}`}>PASSWORD</h3>
                </div>
                <p className={`${textSecondaryClass} text-sm`}>
                  Change your account password
                </p>
              </div>
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="bg-dark-background hover:bg-dark-surface-hover border border-dark-border text-dark-text-primary px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                {showPasswordChange ? 'Cancel' : 'Change Password'}
              </button>
            </div>
            {showPasswordChange && (
              <div className="space-y-4 mt-4">
                <input
                  type="password"
                  placeholder="Current password"
                  className="w-full bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 transition-colors"
                />
                <input
                  type="password"
                  placeholder="New password"
                  className="w-full bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 transition-colors"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 transition-colors"
                />
                <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Update Password
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-8 mb-6">
          <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">Preferences</h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm mb-8">
            Tailor the application to your needs and workflow
          </p>

          {/* Language */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
              INTERFACE LANGUAGE
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 transition-colors"
            >
              <option>English (US)</option>
              <option>English (UK)</option>
              <option>French</option>
              <option>German</option>
            </select>
          </div>

          {/* Timezone */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
              TIMEZONE
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 transition-colors"
            >
              <option>GMT+01:00, Central European Time</option>
              <option>GMT+00:00, Greenwich Mean Time</option>
              <option>GMT-05:00, Eastern Standard Time</option>
              <option>GMT-08:00, Pacific Standard Time</option>
            </select>
          </div>

          {/* Theme Mode Toggle */}
          <div className="mb-6 pb-6 border-b border-light-border dark:border-dark-border">
            <label className="block text-sm font-semibold text-light-text-primarydark:text-dark-text-primary mb-4">              THEME MODE
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 py-4 rounded-lg border-2 transition-all ${
                  theme === 'light'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="material-icons text-warning-500">light_mode</span>
                  <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">Solid Light</span>
                  {theme === 'light' && <span className="material-icons text-primary-500 text-sm">check_circle</span>}
                </div>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 py-4 rounded-lg border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="material-icons text-primary-500">dark_mode</span>
                  <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">Solid Dark</span>
                  {theme === 'dark' && <span className="material-icons text-primary-500 text-sm">check_circle</span>}
                </div>
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
                Push Notifications
              </label>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-primary-500' : 'bg-light-border dark:bg-dark-border'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            <p className={`${textTertiaryClass} text-xs`}>
              Receive push notifications on profile search
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
                Marketing Emails
              </label>
              <button
                onClick={() => setMarketingEmails(!marketingEmails)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  marketingEmails ? 'bg-primary-500' : 'bg-light-border dark:bg-dark-border'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    marketingEmails ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            <p className={`${textTertiaryClass} text-xs`}>
              Receive product updates and offers
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className={`${surfaceClass} border-2 border-error-500/20 rounded-xl p-8`}>
          <h2 className={`text-xl font-bold text-error-500 mb-2`}>Danger Zone</h2>
          <p className={`${textSecondaryClass} text-sm mb-6`}>
            Irreversible actions regarding your account
          </p>

          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-semibold ${textPrimaryClass} mb-1`}>Delete Account</h3>
              <p className={`${textTertiaryClass} text-sm`}>
                Once you delete your account, there is no going back. Please be certain.
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="bg-error-500 hover:bg-error-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              DELETE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
