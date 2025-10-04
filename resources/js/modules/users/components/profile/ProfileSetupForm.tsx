import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import type { ProfileSetupRequest } from '../../types/auth.js';
import FileUpload from '../../../../shared/components/FileUpload.js';
import { AVAILABLE_PLATFORMS, getPlatformById } from '../../../../shared/config/platforms.js';

export default function ProfileSetupForm() {
  const { user, setupProfile, skipProfileSetup, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Multi-stage form management
  const [currentStage, setCurrentStage] = useState(1);
  const totalStages = 4;
  
  // Initialize alias from email (remove @domain part)
  const getDefaultAlias = (email: string): string => {
    const parts = email.split('@');
    return parts[0] || '';
  };

  // Get default profile values for Google sign-in users
  const getDefaultProfileData = (): ProfileSetupRequest => {
    const baseData: ProfileSetupRequest = {
      alias: user?.email ? getDefaultAlias(user.email) : '',
      first_name: '',
      last_name: '',
      contact_phone: '',
      mailing_address: '',
      image_url: '',
      banner_url: '',
      bio: '',
      links: [],
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
    };

    // If user has Google profile data, pre-populate it
    if (user?.name) {
      const nameParts = user.name.split(' ');
      baseData.first_name = nameParts[0] || '';
      baseData.last_name = nameParts.slice(1).join(' ') || '';
    }

    // Use Google profile picture if available
    if (user?.avatar) {
      baseData.image_url = user.avatar;
    }

    return baseData;
  };

  const [profileData, setProfileData] = useState<ProfileSetupRequest>(getDefaultProfileData());
  
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string>('');
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [isSkipping, setIsSkipping] = useState(false);

  // Link management functions
  const addLink = () => {
    setProfileData(prev => ({
      ...prev,
      links: [...(prev.links || []), { platform: '', url: '' }]
    }));
  };

  const removeLink = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      links: (prev.links || []).filter((_, i) => i !== index)
    }));
  };

  const updateLink = (index: number, field: 'platform' | 'url', value: string) => {
    setProfileData(prev => ({
      ...prev,
      links: (prev.links || []).map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  // Stage navigation
  const nextStage = () => {
    if (currentStage < totalStages) {
      setCurrentStage(currentStage + 1);
    }
  };

  const prevStage = () => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
    }
  };

  const canProceedToNext = () => {
    switch (currentStage) {
      case 1:
        return profileData.alias.trim().length > 0;
      case 2:
        return true; // Contact info is optional
      case 3:
        return true; // Images are optional
      case 4:
        return true; // Everything else is optional
      default:
        return false;
    }
  };

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
      // Create minimal profile with default values
      const minimalProfile: ProfileSetupRequest = {
        alias: user?.email ? getDefaultAlias(user.email) : `user_${Date.now()}`,
        first_name: user?.name ? user.name.split(' ')[0] || '' : '',
        last_name: user?.name ? user.name.split(' ').slice(1).join(' ') || '' : '',
        contact_phone: '',
        mailing_address: '',
        image_url: user?.avatar || '',
        banner_url: '',
        bio: '',
        links: [],
        preferences: {
          darkmode: false,
          email_notifications: {
            event_updates: true,
            volunteer_opportunities: false,
            newsletter: false,
            account_security: true,
            marketing: false
          }
        }
      };

      const response = await setupProfile(minimalProfile);
      
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

  const handleImageUploadSuccess = (type: 'image_url' | 'banner_url') => (url: string) => {
    setProfileData(prev => ({ ...prev, [type]: url }));
    // Clear any existing upload errors for this field
    setUploadErrors(prev => ({ ...prev, [type]: '' }));
    // Clear form errors for this field if any
    if (errors[type]) {
      setErrors(prev => ({ ...prev, [type]: [] }));
    }
  };

  const handleImageUploadError = (type: 'image_url' | 'banner_url') => (error: string) => {
    setUploadErrors(prev => ({ ...prev, [type]: error }));
  };

  const handleImageUrlChange = (type: 'image_url' | 'banner_url') => (url: string) => {
    setProfileData(prev => ({ ...prev, [type]: url }));
    // Clear upload errors when manually entering URL
    setUploadErrors(prev => ({ ...prev, [type]: '' }));
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
            Step {currentStage} of {totalStages} - Tell us a bit about yourself
          </p>
          
          {/* Progress Bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStage / totalStages) * 100}%` }}
            ></div>
          </div>
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
          {/* Stage 1: Basic Information */}
          {currentStage === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 text-center">Basic Information</h3>
              
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
                  value={profileData.first_name || ''}
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
                  value={profileData.last_name || ''}
                  onChange={handleInputChange('last_name')}
                  disabled={isLoading || isSkipping}
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.last_name.join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Stage 2: Contact Information */}
          {currentStage === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 text-center">Contact Information</h3>
              
              {/* Contact Phone */}
              <div>
                <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700">
                  Contact Phone
                </label>
                <input
                  id="contact_phone"
                  name="contact_phone"
                  type="tel"
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    errors.contact_phone ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="Your phone number"
                  value={profileData.contact_phone || ''}
                  onChange={handleInputChange('contact_phone')}
                  disabled={isLoading || isSkipping}
                />
                {errors.contact_phone && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.contact_phone.join(', ')}
                  </p>
                )}
              </div>

              {/* Mailing Address */}
              <div>
                <label htmlFor="mailing_address" className="block text-sm font-medium text-gray-700">
                  Mailing Address
                </label>
                <textarea
                  id="mailing_address"
                  name="mailing_address"
                  rows={3}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    errors.mailing_address ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="Your mailing address"
                  value={profileData.mailing_address || ''}
                  onChange={handleInputChange('mailing_address')}
                  disabled={isLoading || isSkipping}
                />
                {errors.mailing_address && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.mailing_address.join(', ')}
                  </p>
                )}
              </div>

              {/* Social Links */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Social Links
                  </label>
                  <button
                    type="button"
                    onClick={addLink}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                    disabled={isLoading || isSkipping}
                  >
                    + Add Link
                  </button>
                </div>
                
                <div className="space-y-3">
                  {(profileData.links || []).length === 0 ? (
                    <div className="px-3 py-2 text-gray-500 bg-gray-50 rounded-md text-center">
                      No links added yet
                      <button
                        type="button"
                        onClick={addLink}
                        className="ml-2 text-indigo-600 hover:text-indigo-500"
                        disabled={isLoading || isSkipping}
                      >
                        Add your first link
                      </button>
                    </div>
                  ) : (
                    (profileData.links || []).map((link, index) => {
                      const platform = getPlatformById(link.platform);
                      return (
                        <div key={index} className="border border-gray-200 rounded-md p-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <select
                                value={link.platform}
                                onChange={(e) => updateLink(index, 'platform', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={isLoading || isSkipping}
                              >
                                <option value="">Select platform</option>
                                {AVAILABLE_PLATFORMS.map((platform) => (
                                  <option key={platform.id} value={platform.id}>
                                    {platform.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => removeLink(index)}
                                className="px-2 py-2 text-red-600 hover:text-red-500"
                                title="Remove link"
                                disabled={isLoading || isSkipping}
                              >
                                ✕
                              </button>
                            </div>
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) => updateLink(index, 'url', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder={platform ? platform.placeholder : "Enter URL"}
                              disabled={isLoading || isSkipping}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stage 3: Images */}
          {currentStage === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 text-center">Profile Images</h3>
              
              {/* Profile Image Upload */}
              <div>
                <FileUpload
                  label="Profile Image"
                  type="profile"
                  currentUrl={profileData.image_url || ''}
                  onUploadSuccess={handleImageUploadSuccess('image_url')}
                  onUploadError={handleImageUploadError('image_url')}
                  onUrlChange={handleImageUrlChange('image_url')}
                  disabled={isLoading || isSkipping}
                  showUrlInput={true}
                  maxSize={2}
                />
                {errors.image_url && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.image_url.join(', ')}
                  </p>
                )}
                {uploadErrors.image_url && (
                  <p className="mt-1 text-sm text-red-600">
                    {uploadErrors.image_url}
                  </p>
                )}
              </div>

              {/* Profile Banner Upload */}
              <div>
                <FileUpload
                  label="Profile Banner"
                  type="banner"
                  currentUrl={profileData.banner_url || ''}
                  onUploadSuccess={handleImageUploadSuccess('banner_url')}
                  onUploadError={handleImageUploadError('banner_url')}
                  onUrlChange={handleImageUrlChange('banner_url')}
                  disabled={isLoading || isSkipping}
                  showUrlInput={true}
                  maxSize={2}
                />
                {errors.banner_url && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.banner_url.join(', ')}
                  </p>
                )}
                {uploadErrors.banner_url && (
                  <p className="mt-1 text-sm text-red-600">
                    {uploadErrors.banner_url}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Stage 4: Bio and Preferences */}
          {currentStage === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 text-center">About You & Preferences</h3>
              
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
                  value={profileData.bio || ''}
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
          )}

          {/* Navigation Buttons */}
          <div className="space-y-3">
            <div className="flex justify-between">
              {currentStage > 1 && (
                <button
                  type="button"
                  onClick={prevStage}
                  disabled={isLoading || isSkipping}
                  className={`px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${
                    isLoading || isSkipping
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
                >
                  Previous
                </button>
              )}
              
              <div className="flex-1"></div>
              
              {currentStage < totalStages ? (
                <button
                  type="button"
                  onClick={nextStage}
                  disabled={!canProceedToNext() || isLoading || isSkipping}
                  className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                    !canProceedToNext() || isLoading || isSkipping
                      ? 'bg-indigo-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || isSkipping}
                  className={`px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
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
              )}
            </div>

            {/* Skip Button */}
            <button
              type="button"
              onClick={handleSkip}
              disabled={isLoading || isSkipping}
              className={`w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${
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