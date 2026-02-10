'use client';

import { useState, useEffect } from 'react';
import { Bell, Calendar, Clock, CheckCircle, AlertCircle, Settings } from 'lucide-react';

interface Deadline {
  id: string;
  form_type: string;
  tax_year: number;
  deadline_date: string;
  description: string;
  status: 'upcoming' | 'due_soon' | 'overdue';
  days_remaining: number;
}

interface Reminder {
  id: string;
  deadline_id: string;
  reminder_date: string;
  sent: boolean;
  email_sent_at?: string;
}

export default function NotificationsPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    enabled: true,
    email: true,
    inApp: true
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Fetch upcoming deadlines
      const deadlinesResponse = await fetch('/api/deadlines/upcoming');
      const deadlinesData = await deadlinesResponse.json();
      
      if (deadlinesData.success) {
        setDeadlines(deadlinesData.deadlines);
      }

      // Fetch reminder history
      const remindersResponse = await fetch('/api/reminders/history');
      const remindersData = await remindersResponse.json();
      
      if (remindersData.success) {
        setReminders(remindersData.reminders);
      }

      // Fetch preferences
      const prefsResponse = await fetch('/api/notifications/preferences');
      const prefsData = await prefsResponse.json();
      
      if (prefsData.success) {
        setPreferences(prefsData.preferences);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = async (key: 'enabled' | 'email' | 'inApp') => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key]
    };
    
    setPreferences(newPreferences);

    try {
      await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences)
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'due_soon':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'due_soon':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getFormTypeName = (formType: string) => {
    const names: Record<string, string> = {
      PIT: 'Personal Income Tax (PIT)',
      CIT: 'Company Income Tax (CIT)',
      VAT_Q1: 'VAT Return - Q1',
      VAT_Q2: 'VAT Return - Q2',
      VAT_Q3: 'VAT Return - Q3',
      VAT_Q4: 'VAT Return - Q4'
    };
    return names[formType] || formType;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
              <p className="text-gray-600">Stay on top of your tax filing deadlines</p>
            </div>
            <button
              onClick={() => {/* Open settings modal */}}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Enable Notifications</h3>
                <p className="text-sm text-gray-600">Receive deadline reminders</p>
              </div>
              <button
                onClick={() => togglePreference('enabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.enabled ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-600">Receive reminders via email</p>
              </div>
              <button
                onClick={() => togglePreference('email')}
                disabled={!preferences.enabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.email && preferences.enabled ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.email && preferences.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">In-App Notifications</h3>
                <p className="text-sm text-gray-600">Show notifications in the app</p>
              </div>
              <button
                onClick={() => togglePreference('inApp')}
                disabled={!preferences.enabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.inApp && preferences.enabled ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.inApp && preferences.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-lg mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Upcoming Deadlines
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {deadlines.length} {deadlines.length === 1 ? 'deadline' : 'deadlines'} in the next 30 days
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <p className="mt-4 text-gray-600">Loading deadlines...</p>
            </div>
          ) : deadlines.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600">No upcoming deadlines in the next 30 days</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {deadlines.map((deadline) => (
                <div key={deadline.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg border-2 ${getStatusColor(deadline.status)}`}>
                        {getStatusIcon(deadline.status)}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {getFormTypeName(deadline.form_type)}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{deadline.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {new Date(deadline.deadline_date).toLocaleDateString('en-NG', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                          <span className={`font-semibold ${
                            deadline.days_remaining < 0 ? 'text-red-600' :
                            deadline.days_remaining <= 7 ? 'text-yellow-600' :
                            'text-emerald-600'
                          }`}>
                            {deadline.days_remaining < 0 
                              ? `${Math.abs(deadline.days_remaining)} days overdue`
                              : `${deadline.days_remaining} days remaining`
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href="/filing"
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                    >
                      File Now
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reminder History */}
        <div className="bg-white rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-600" />
              Reminder History
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Recent reminder notifications sent
            </p>
          </div>

          {reminders.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reminders yet</h3>
              <p className="text-gray-600">Reminders will appear here when sent</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {reminders.slice(0, 10).map((reminder) => (
                <div key={reminder.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {reminder.sent ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Reminder sent for {reminder.deadline_id}
                        </p>
                        <p className="text-xs text-gray-600">
                          {reminder.email_sent_at 
                            ? new Date(reminder.email_sent_at).toLocaleString('en-NG')
                            : 'Scheduled for ' + new Date(reminder.reminder_date).toLocaleDateString('en-NG')
                          }
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      reminder.sent 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {reminder.sent ? 'Sent' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
