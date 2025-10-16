import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const NotificationSettings = () => {
  const { user } = useContext(AuthContext);
  const [preferences, setPreferences] = useState({
    email_reminders: true,
    reminder_time: "19:00",
    streak_reminders: true,
    achievement_notifications: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://127.0.0.1:8000/notifications/preferences/${user.uid}`);
      
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const response = await fetch('http://127.0.0.1:8000/notifications/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.uid,
          preferences: preferences
        })
      });

      if (response.ok) {
        toast.success('Notification settings saved successfully!');
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const sendTestEmail = async (type) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/notifications/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          type: type,
          user_name: user.displayName || 'Test User',
          current_streak: 5,
          longest_streak: 10,
          achievement_name: 'Week Warrior',
          achievement_emoji: '🔥'
        })
      });

      if (response.ok) {
        toast.success(`Test ${type.replace('_', ' ')} email sent!`);
      } else {
        throw new Error('Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          📧 Email Notifications
        </h3>
        <p className="text-sm text-gray-600">
          Configure when and how you receive learning reminders
        </p>
      </div>

      <div className="space-y-6">
        {/* Email Reminders Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-800">Email Reminders</h4>
            <p className="text-sm text-gray-600">Receive email notifications for learning reminders</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.email_reminders}
              onChange={(e) => handlePreferenceChange('email_reminders', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Reminder Time */}
        {preferences.email_reminders && (
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <h4 className="font-medium text-gray-800">Reminder Time</h4>
              <p className="text-sm text-gray-600">What time should we send daily reminders?</p>
            </div>
            <select
              value={preferences.reminder_time}
              onChange={(e) => handlePreferenceChange('reminder_time', e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              <option value="08:00">8:00 AM</option>
              <option value="12:00">12:00 PM</option>
              <option value="17:00">5:00 PM</option>
              <option value="19:00">7:00 PM</option>
              <option value="20:00">8:00 PM</option>
              <option value="21:00">9:00 PM</option>
            </select>
          </div>
        )}

        {/* Streak Reminders */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-800">Streak Reminders</h4>
            <p className="text-sm text-gray-600">Get notified when your learning streak is at risk</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.streak_reminders}
              onChange={(e) => handlePreferenceChange('streak_reminders', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>

        {/* Achievement Notifications */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-800">Achievement Notifications</h4>
            <p className="text-sm text-gray-600">Celebrate when you unlock new achievements</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.achievement_notifications}
              onChange={(e) => handlePreferenceChange('achievement_notifications', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>

        {/* Save Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? 'Saving...' : 'Save Notification Settings'}
          </button>
        </div>

        {/* Test Emails Section */}
        <div className="border-t pt-6 mt-6">
          <h4 className="font-medium text-gray-800 mb-4">🧪 Test Email Notifications</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => sendTestEmail('streak_reminder')}
              className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg hover:bg-orange-200 transition text-sm"
            >
              🔥 Test Streak Reminder
            </button>
            <button
              onClick={() => sendTestEmail('streak_broken')}
              className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg hover:bg-purple-200 transition text-sm"
            >
              💔 Test Broken Streak
            </button>
            <button
              onClick={() => sendTestEmail('achievement')}
              className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition text-sm"
            >
              🏆 Test Achievement
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Test emails will be sent to: {user?.email}
          </p>
        </div>

        {/* Email Requirements */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <div>
              <h4 className="font-medium text-yellow-800">Email Setup Required</h4>
              <p className="text-sm text-yellow-700 mt-1">
                To receive email notifications, make sure your email address is verified in your profile settings.
                Emails will be sent from our FluentEase learning system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;