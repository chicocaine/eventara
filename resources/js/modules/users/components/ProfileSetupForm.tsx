import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import type { ProfileSetupRequest } from '../types/auth.js';

export default function ProfileSetupForm() {
  const { user, setupProfile, skipProfileSetup, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Initialize alias from email (remove @domain part)
  const getDefaultAlias = (email: string): string => {
    const parts = email.split('@');
    return parts[0] || '';
  };

  const [profileData, setProfileData] = useState<ProfileSetupRequest>({
    alias: user?.email ? getDefaultAlias(user.email) : '',
    first_name: '',
    last_name: '',
    image_url: '',
    bio: '',
    preferences: { 
      darkmode: false,
      email_notifications: {
        event_updates: true,
        volunteer_opportunities: true,
        newsletter: false,
        account_security: true,
        marketing: false
      }
    }
  });
  
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string>('');
  const [isSkipping, setIsSkipping] = useState(false);

  // Redirect to dashboard if no user (should be authenticated)
  useEffect(() => {
    if (!user && !isLoading) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setMessage('');

    // Basic validation
    if (!profileData.alias.trim()) {
      setErrors({ alias: ['Alias is required'] });
      return;
    }

    try {
      const response = await setupProfile(profileData);
      
      if (response.success) {
        // Redirect to dashboard after successful profile setup
        navigate('/dashboard', {
          state: { message: 'Profile setup completed successfully!' }
        });
      } else {
        setMessage(response.message);
        if (response.errors) {
          setErrors(response.errors);
        }
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      setMessage('An unexpected error occurred. Please try again.');
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    setErrors({});
    setMessage('');

    try {
      const response = await skipProfileSetup();
      
      if (response.success) {
        // Redirect to dashboard after skipping profile setup
        navigate('/dashboard', {
          state: { message: 'Welcome to Eventara! You can update your profile anytime from settings.' }
        });
      } else {
        setMessage(response.message || 'Failed to skip profile setup.');
      }
    } catch (error) {
      console.error('Skip profile setup error:', error);
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSkipping(false);
    }
  };

  const handleInputChange = (field: keyof ProfileSetupRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setProfileData(prev => ({ ...prev, [field]: e.target.value }));
    
    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: [] }));
    }
    if (message) {
      setMessage('');
    }
  };

  const handlePreferenceChange = (key: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      preferences: { 
        ...prev.preferences!,
        [key]: value 
      }
    }));
  };

  const handleEmailPreferenceChange = (key: string, value: boolean) => {
    setProfileData(prev => ({
      ...prev,
      preferences: { 
        ...prev.preferences!,
        email_notifications: {
          ...prev.preferences!.email_notifications,
          [key]: value
        }
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set up your profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Tell us a bit about yourself (or skip for now)
          </p>
        </div>

        {message && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {message}
          </div>
        )}

        {errors.general && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <ul>
              {errors.general.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Alias Field */}
            <div>
              <label htmlFor="alias" className="block text-sm font-medium text-gray-700">
                Alias / Username <span className="text-red-500">*</span>
              </label>
              <input
                id="alias"
                name="alias"
                type="text"
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.alias ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Your username or alias"
                value={profileData.alias}
                onChange={handleInputChange('alias')}
                disabled={isLoading || isSkipping}
              />
              {errors.alias && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.alias.join(', ')}
                </p>
              )}
            </div>

            {/* First Name Field */}
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.first_name ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Your first name"
                value={profileData.first_name}
                onChange={handleInputChange('first_name')}
                disabled={isLoading || isSkipping}
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.first_name.join(', ')}
                </p>
              )}
            </div>

            {/* Last Name Field */}
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.last_name ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Your last name"
                value={profileData.last_name}
                onChange={handleInputChange('last_name')}
                disabled={isLoading || isSkipping}
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.last_name.join(', ')}
                </p>
              )}
            </div>

            {/* Image URL Field */}
            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">
                Profile Image URL
              </label>
              <input
                id="image_url"
                name="image_url"
                type="url"
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.image_url ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="https://example.com/your-photo.jpg"
                value={profileData.image_url}
                onChange={handleInputChange('image_url')}
                disabled={isLoading || isSkipping}
              />
              {errors.image_url && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.image_url.join(', ')}
                </p>
              )}
            </div>

            {/* Bio Field */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.bio ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Tell us about yourself..."
                value={profileData.bio}
                onChange={handleInputChange('bio')}
                disabled={isLoading || isSkipping}
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.bio.join(', ')}
                </p>
              )}
            </div>

            {/* Preferences */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferences
              </label>
              <div className="space-y-4">
                {/* Dark Mode */}
                <div className="flex items-center">
                  <input
                    id="darkmode"
                    name="darkmode"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={profileData.preferences?.darkmode || false}
                    onChange={(e) => handlePreferenceChange('darkmode', e.target.checked)}
                    disabled={isLoading || isSkipping}
                  />
                  <label htmlFor="darkmode" className="ml-2 block text-sm text-gray-900">
                    Enable dark mode
                  </label>
                </div>

                {/* Email Notifications */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Email Notifications</h4>
                  <div className="space-y-2 pl-2">
                    <div className="flex items-center">
                      <input
                        id="event_updates"
                        name="event_updates"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={profileData.preferences?.email_notifications?.event_updates || false}
                        onChange={(e) => handleEmailPreferenceChange('event_updates', e.target.checked)}
                        disabled={isLoading || isSkipping}
                      />
                      <label htmlFor="event_updates" className="ml-2 block text-sm text-gray-700">
                        Event updates and announcements
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="volunteer_opportunities"
                        name="volunteer_opportunities"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={profileData.preferences?.email_notifications?.volunteer_opportunities || false}
                        onChange={(e) => handleEmailPreferenceChange('volunteer_opportunities', e.target.checked)}
                        disabled={isLoading || isSkipping}
                      />
                      <label htmlFor="volunteer_opportunities" className="ml-2 block text-sm text-gray-700">
                        Volunteer opportunities
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="newsletter"
                        name="newsletter"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={profileData.preferences?.email_notifications?.newsletter || false}
                        onChange={(e) => handleEmailPreferenceChange('newsletter', e.target.checked)}
                        disabled={isLoading || isSkipping}
                      />
                      <label htmlFor="newsletter" className="ml-2 block text-sm text-gray-700">
                        Monthly newsletter
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="account_security"
                        name="account_security"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={profileData.preferences?.email_notifications?.account_security || false}
                        onChange={(e) => handleEmailPreferenceChange('account_security', e.target.checked)}
                        disabled={isLoading || isSkipping}
                      />
                      <label htmlFor="account_security" className="ml-2 block text-sm text-gray-700">
                        Account security alerts (recommended)
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="marketing"
                        name="marketing"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={profileData.preferences?.email_notifications?.marketing || false}
                        onChange={(e) => handleEmailPreferenceChange('marketing', e.target.checked)}
                        disabled={isLoading || isSkipping}
                      />
                      <label htmlFor="marketing" className="ml-2 block text-sm text-gray-700">
                        Marketing and promotional content
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || isSkipping}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading || isSkipping
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Setting up profile...
                </>
              ) : (
                'Complete Setup'
              )}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={isLoading || isSkipping}
              className={`group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${
                isLoading || isSkipping
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {isSkipping ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Skipping...
                </>
              ) : (
                'Skip for now'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}