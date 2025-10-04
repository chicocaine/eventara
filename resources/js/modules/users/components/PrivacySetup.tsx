import React, { useState } from 'react';
import { getDefaultUserSettings, getPrivacyFocusedDefaults, type UserSettings } from '../services/settingsService.js';

interface PrivacySetupProps {
  onComplete: (settings: UserSettings) => void;
  onSkip?: () => void;
  showSkipOption?: boolean;
}

export default function PrivacySetup({ onComplete, onSkip, showSkipOption = true }: PrivacySetupProps) {
  const [settings, setSettings] = useState<UserSettings>(getDefaultUserSettings());
  const [selectedPreset, setSelectedPreset] = useState<'default' | 'privacy-focused' | 'custom'>('default');

  const handlePresetChange = (preset: 'default' | 'privacy-focused' | 'custom') => {
    setSelectedPreset(preset);
    if (preset === 'default') {
      setSettings(getDefaultUserSettings());
    } else if (preset === 'privacy-focused') {
      setSettings(getPrivacyFocusedDefaults());
    }
    // For 'custom', keep current settings
  };

  const handleSettingChange = (section: keyof UserSettings, key: string, value: any) => {
    setSelectedPreset('custom');
    setSettings(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' && prev[section] !== null
        ? { ...prev[section], [key]: value }
        : value
    }));
  };

  const handleComplete = () => {
    onComplete(settings);
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      // Use default settings if no skip handler provided
      onComplete(getDefaultUserSettings());
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Privacy & Preferences</h2>
        <p className="text-gray-600">
          Set up your privacy preferences and notification settings. You can always change these later in your profile settings.
        </p>
      </div>

      {/* Preset Options */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Choose a Privacy Preset</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handlePresetChange('default')}
            className={`p-4 border-2 rounded-lg text-left transition-colors duration-200 ${
              selectedPreset === 'default'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center mb-2">
              <div className={`w-4 h-4 rounded-full mr-3 ${
                selectedPreset === 'default' ? 'bg-indigo-500' : 'bg-gray-300'
              }`} />
              <h4 className="font-medium text-gray-900">Balanced</h4>
            </div>
            <p className="text-sm text-gray-600">
              A good balance between functionality and privacy. Public profile with selective notifications.
            </p>
          </button>

          <button
            onClick={() => handlePresetChange('privacy-focused')}
            className={`p-4 border-2 rounded-lg text-left transition-colors duration-200 ${
              selectedPreset === 'privacy-focused'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center mb-2">
              <div className={`w-4 h-4 rounded-full mr-3 ${
                selectedPreset === 'privacy-focused' ? 'bg-indigo-500' : 'bg-gray-300'
              }`} />
              <h4 className="font-medium text-gray-900">Privacy Focused</h4>
            </div>
            <p className="text-sm text-gray-600">
              Maximum privacy settings. Friends-only profile with minimal data sharing.
            </p>
          </button>
        </div>
      </div>

      {/* Detailed Settings */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Privacy</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Who can see your profile?</label>
              <select
                value={settings.privacy.profile_visibility}
                onChange={(e) => handleSettingChange('privacy', 'profile_visibility', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="public">Everyone (Public)</option>
                <option value="friends">Friends Only</option>
                <option value="private">Only Me (Private)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Show when you're online</label>
                <p className="text-sm text-gray-500">Let others see your online status</p>
              </div>
              <button
                onClick={() => handleSettingChange('privacy', 'show_online_status', !settings.privacy.show_online_status)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.privacy.show_online_status ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.privacy.show_online_status ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Allow friend requests</label>
                <p className="text-sm text-gray-500">Let other users send you friend requests</p>
              </div>
              <button
                onClick={() => handleSettingChange('privacy', 'allow_friend_requests', !settings.privacy.allow_friend_requests)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.privacy.allow_friend_requests ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.privacy.allow_friend_requests ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Email notifications</label>
                <p className="text-sm text-gray-500">Important updates and security alerts</p>
              </div>
              <button
                onClick={() => handleSettingChange('notifications', 'email_notifications', !settings.notifications.email_notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications.email_notifications ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications.email_notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Event reminders</label>
                <p className="text-sm text-gray-500">Get notified about upcoming events</p>
              </div>
              <button
                onClick={() => handleSettingChange('notifications', 'event_reminders', !settings.notifications.event_reminders)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications.event_reminders ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications.event_reminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Data & Marketing</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Help improve Eventara</label>
                <p className="text-sm text-gray-500">Share anonymous usage data to help us improve</p>
              </div>
              <button
                onClick={() => handleSettingChange('privacy', 'data_collection_consent', !settings.privacy.data_collection_consent)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.privacy.data_collection_consent ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.privacy.data_collection_consent ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Marketing emails</label>
                <p className="text-sm text-gray-500">Receive updates about new features and events</p>
              </div>
              <button
                onClick={() => handleSettingChange('privacy', 'marketing_emails_consent', !settings.privacy.marketing_emails_consent)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.privacy.marketing_emails_consent ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.privacy.marketing_emails_consent ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        {showSkipOption && (
          <button
            onClick={handleSkip}
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
          >
            Skip for now
          </button>
        )}
        
        <div className="flex space-x-3">
          <button
            onClick={handleComplete}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* Privacy Note */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex">
          <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-800">Your Privacy Matters</h4>
            <p className="text-sm text-blue-700 mt-1">
              You can change these settings anytime in your profile. We never share your personal data with third parties without your explicit consent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}