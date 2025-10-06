import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { settingsService, getDefaultUserSettings, type UserSettings } from '../services/settingsService.js';

interface SettingsTabProps {}

export default function SettingsTab({}: SettingsTabProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(getDefaultUserSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // Account management states
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deactivateConfirmText, setDeactivateConfirmText] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Password change states
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Determine if user needs to set initial password (OAuth users who haven't set password)
  const needsToSetPassword = user?.auth_provider && !user?.password_set_by_user;
  const canChangePassword = user?.password_set_by_user;

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await settingsService.getSettings();
        if (response.success && response.data) {
          setSettings(response.data);
        } else {
          // Fallback to localStorage if API is not available
          const savedSettings = localStorage.getItem('userSettings');
          if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        // Fallback to localStorage
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
          try {
            setSettings(JSON.parse(savedSettings));
          } catch (parseError) {
            console.error('Failed to parse saved settings:', parseError);
          }
        }
      }
    };

    loadSettings();
  }, []);

  const handleSettingChange = (section: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' && prev[section] !== null
        ? { ...prev[section], [key]: value }
        : value
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await settingsService.updateSettings(settings);
      if (response.success) {
        setSaveMessage('Settings saved successfully!');
        // Also save to localStorage as backup
        localStorage.setItem('userSettings', JSON.stringify(settings));
      } else {
        setSaveMessage(response.message || 'Failed to save settings. Please try again.');
      }
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Fallback to localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings));
      setSaveMessage('Settings saved locally. Some features may not work until you\'re online.');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const getRequiredDeactivateText = () => {
    return `deactivate-${user?.email?.split('@')[0] || 'account'}`;
  };

  const getRequiredDeleteText = () => {
    return `delete-${user?.email?.split('@')[0] || 'account'}`;
  };

  // Effect to manage body scroll when modals are open
  useEffect(() => {
    if (showDeactivateModal || showDeleteModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDeactivateModal, showDeleteModal]);

  const handleDeactivateAccount = async () => {
    if (deactivateConfirmText !== getRequiredDeactivateText()) {
      return;
    }

    setIsDeactivating(true);
    try {
      const response = await settingsService.deactivateAccount(deactivateConfirmText);
      if (response.success) {
        alert('Account deactivated successfully. You will be logged out.');
        // TODO: Handle logout and redirect
        window.location.href = '/login';
      } else {
        alert(response.message || 'Failed to deactivate account. Please try again.');
      }
    } catch (error) {
      console.error('Failed to deactivate account:', error);
      alert('Failed to deactivate account. Please try again.');
    } finally {
      setIsDeactivating(false);
      setShowDeactivateModal(false);
      setDeactivateConfirmText('');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== getRequiredDeleteText()) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await settingsService.deleteAccount(deleteConfirmText);
      if (response.success) {
        alert('Account deleted successfully.');
        // TODO: Handle logout and redirect
        window.location.href = '/';
      } else {
        alert(response.message || 'Failed to delete account. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmText('');
    }
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    
    return errors;
  };

  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    
    // Clear previous errors and messages
    setPasswordErrors([]);
    setPasswordMessage(null);
    
    // Validate new password if it's being changed
    if (field === 'newPassword' && value) {
      const errors = validatePassword(value);
      setPasswordErrors(errors);
    }
    
    // Check if passwords match when confirming
    if (field === 'confirmPassword' && value && passwordData.newPassword && value !== passwordData.newPassword) {
      setPasswordErrors(['Passwords do not match']);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields are filled
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordErrors(['All fields are required']);
      return;
    }
    
    // Validate new password
    const newPasswordErrors = validatePassword(passwordData.newPassword);
    if (newPasswordErrors.length > 0) {
      setPasswordErrors(newPasswordErrors);
      return;
    }
    
    // Check if passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordErrors(['New passwords do not match']);
      return;
    }
    
    // Check if new password is different from old password
    if (passwordData.oldPassword === passwordData.newPassword) {
      setPasswordErrors(['New password must be different from current password']);
      return;
    }
    
    setIsChangingPassword(true);
    setPasswordErrors([]);
    
    try {
      const response = await settingsService.changePassword(
        passwordData.oldPassword,
        passwordData.newPassword,
        passwordData.confirmPassword
      );
      
      if (response.success) {
        setPasswordMessage('Password changed successfully!');
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPasswordMessage(null), 5000);
      } else {
        setPasswordErrors([response.message || 'Failed to change password']);
      }
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordErrors(['An unexpected error occurred. Please try again.']);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSetInitialPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields for initial password setting
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordErrors(['Password and confirmation are required']);
      return;
    }
    
    // Validate new password
    const newPasswordErrors = validatePassword(passwordData.newPassword);
    if (newPasswordErrors.length > 0) {
      setPasswordErrors(newPasswordErrors);
      return;
    }
    
    // Check if passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordErrors(['Passwords do not match']);
      return;
    }
    
    setIsChangingPassword(true);
    setPasswordErrors([]);
    
    try {
      const response = await settingsService.setInitialPassword(
        passwordData.newPassword,
        passwordData.confirmPassword
      );
      
      if (response.success) {
        setPasswordMessage(response.message || 'Password set successfully!');
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        
        // Update user state to reflect that password has been set
        // This would need to be handled by the auth context/hook
        // For now, we'll just show success message
        setTimeout(() => {
          setPasswordMessage(null);
          // Optionally refresh page or update auth state
          window.location.reload();
        }, 3000);
      } else {
        setPasswordErrors([response.message || 'Failed to set password']);
      }
    } catch (error) {
      console.error('Set initial password error:', error);
      setPasswordErrors(['An unexpected error occurred. Please try again.']);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-md ${saveMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {saveMessage}
        </div>
      )}

      {/* Password Change Message */}
      {passwordMessage && (
        <div className="p-4 rounded-md bg-green-50 text-green-700">
          {passwordMessage}
        </div>
      )}

      {/* Appearance Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Appearance</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Dark Mode</label>
              <p className="text-sm text-gray-500">Toggle between light and dark themes</p>
            </div>
            <button
              onClick={() => handleSettingChange('dark_mode', '', !settings.dark_mode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.dark_mode ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.dark_mode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
        <div className="space-y-4">
          {Object.entries(settings.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/_/g, ' ')}
                </label>
                <p className="text-sm text-gray-500">
                  {key === 'email_notifications' && 'Receive notifications via email'}
                  {key === 'push_notifications' && 'Receive push notifications in your browser'}
                  {key === 'event_reminders' && 'Get reminders about upcoming events'}
                  {key === 'venue_updates' && 'Notifications about venue changes and updates'}
                  {key === 'security_alerts' && 'Important security and account notifications'}
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('notifications', key, !value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Profile Visibility</label>
            <p className="text-sm text-gray-500 mb-2">Who can see your profile information</p>
            <select
              value={settings.privacy.profile_visibility}
              onChange={(e) => handleSettingChange('privacy', 'profile_visibility', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="public">Public - Everyone can see your profile</option>
              <option value="friends">Friends Only - Only your connections can see your profile</option>
              <option value="private">Private - Only you can see your profile</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Show Online Status</label>
              <p className="text-sm text-gray-500">Let others see when you're online</p>
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
              <label className="text-sm font-medium text-gray-700">Allow Friend Requests</label>
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

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Show Activity Status</label>
              <p className="text-sm text-gray-500">Display your activity and event participation</p>
            </div>
            <button
              onClick={() => handleSettingChange('privacy', 'show_activity_status', !settings.privacy.show_activity_status)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.privacy.show_activity_status ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.privacy.show_activity_status ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Data & Marketing Preferences */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data & Marketing</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Data Collection Consent</label>
              <p className="text-sm text-gray-500">Allow us to collect analytics data to improve our services</p>
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
              <label className="text-sm font-medium text-gray-700">Marketing Emails</label>
              <p className="text-sm text-gray-500">Receive emails about new features, events, and promotions</p>
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

      {/* Security Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {needsToSetPassword ? 'Set Password' : 'Change Password'}
            </label>
            <p className="text-sm text-gray-500 mb-4">
              {needsToSetPassword 
                ? `Since you signed up with ${user?.auth_provider === 'google' ? 'Google' : 'OAuth'}, you can optionally set a password to enable email/password login.`
                : 'Update your account password for better security'
              }
            </p>
            
            <form onSubmit={needsToSetPassword ? handleSetInitialPassword : handleChangePassword} className="space-y-4">
              {/* Current Password Field - Only show for password change */}
              {canChangePassword && (
                <div>
                  <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your current password"
                    required
                  />
                </div>
              )}

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  {needsToSetPassword ? 'Password' : 'New Password'}
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={needsToSetPassword ? "Enter your password" : "Enter your new password"}
                  required
                />
                <div className="mt-2 text-xs text-gray-500">
                  <p>Password requirements:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>At least 8 characters long</li>
                    <li>One uppercase letter (A-Z)</li>
                    <li>One lowercase letter (a-z)</li>
                    <li>One number (0-9)</li>
                    <li>One special character (@$!%*?&)</li>
                  </ul>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              {/* Password Errors */}
              {passwordErrors.length > 0 && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <div className="flex">
                    <svg className="h-5 w-5 text-red-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-red-800">Please fix the following issues:</h4>
                      <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                        {passwordErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword || passwordErrors.length > 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-md transition-colors duration-200 flex items-center"
                >
                  {isChangingPassword ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {needsToSetPassword ? 'Setting Password...' : 'Changing Password...'}
                    </>
                  ) : (
                    needsToSetPassword ? 'Set Password' : 'Change Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>      {/* Save Settings Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h3>
        <div className="bg-red-50 border border-red-200 rounded-md p-6 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-red-800 mb-2">Deactivate Account</h4>
            <p className="text-sm text-red-700 mb-3">
              Temporarily disable your account. You can reactivate it anytime by logging in again.
            </p>
            <button
              onClick={() => setShowDeactivateModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Deactivate Account
            </button>
          </div>

          <div className="border-t border-red-200 pt-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">Delete Account</h4>
            <p className="text-sm text-red-700 mb-3">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Deactivate Account Modal */}
      {showDeactivateModal && (
        <div 
          className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          style={{ margin: 0, position: 'fixed', inset: 0 }}
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative z-10">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Deactivate Account</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to deactivate your account? You can reactivate it anytime by logging in again.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              To confirm, type <strong>{getRequiredDeactivateText()}</strong> in the box below:
            </p>
            <input
              type="text"
              value={deactivateConfirmText}
              onChange={(e) => setDeactivateConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mb-4"
              placeholder={getRequiredDeactivateText()}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivateConfirmText('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateAccount}
                disabled={deactivateConfirmText !== getRequiredDeactivateText() || isDeactivating}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-md transition-colors duration-200 flex items-center"
              >
                {isDeactivating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deactivating...
                  </>
                ) : (
                  'Deactivate Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div 
          className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          style={{ margin: 0, position: 'fixed', inset: 0 }}
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative z-10">
            <h3 className="text-lg font-medium text-red-900 mb-4">Delete Account</h3>
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm font-medium text-red-800">Warning: This action is irreversible</span>
              </div>
              <p className="text-sm text-gray-600">
                Deleting your account will permanently remove all your data, including your profile, events, and all associated information. This action cannot be undone.
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              To confirm, type <strong>{getRequiredDeleteText()}</strong> in the box below:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 mb-4"
              placeholder={getRequiredDeleteText()}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== getRequiredDeleteText() || isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-800 hover:bg-red-900 disabled:bg-red-400 rounded-md transition-colors duration-200 flex items-center"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}