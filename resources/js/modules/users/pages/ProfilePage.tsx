import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../../shared/layouts/index.js';
import { useAuth } from '../hooks/useAuth.js';
import type { UserProfile, FileUploadResponse } from '../types/auth.js';
import { profileService } from '../services/profileService.js';
import { AVAILABLE_PLATFORMS, getPlatformById, validatePlatformUrl } from '../../../shared/config/platforms.js';

interface ProfilePageProps {}

export default function ProfilePage({}: ProfilePageProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'posts'>('details');
  
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    alias: '',
    first_name: '',
    last_name: '',
    contact_phone: '',
    bio: '',
    mailing_address: '',
    links: [] as Array<{ platform: string; url: string; }>,
  });
  
  // Image upload states
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await profileService.getProfile();
      
      if (response.success && response.profile) {
        setProfile(response.profile);
        setFormData({
          alias: response.profile.alias || '',
          first_name: response.profile.first_name || '',
          last_name: response.profile.last_name || '',
          contact_phone: response.profile.contact_phone || '',
          bio: response.profile.bio || '',
          mailing_address: response.profile.mailing_address || '',
          links: response.profile.links || [],
        });
      } else {
        setError(response.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Link management functions
  const addLink = () => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        links: [...prev.links, { platform: '', url: '' }]
      };
      
      // Trigger change detection with the updated data
      if (profile) {
        setTimeout(() => {
          checkForChangesWithData(newFormData);
        }, 0);
      }
      
      return newFormData;
    });
  };

  const removeLink = (index: number) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        links: prev.links.filter((_, i) => i !== index)
      };
      
      // Trigger change detection with the updated data
      if (profile) {
        setTimeout(() => {
          checkForChangesWithData(newFormData);
        }, 0);
      }
      
      return newFormData;
    });
  };

  const updateLink = (index: number, field: 'platform' | 'url', value: string) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        links: prev.links.map((link, i) => 
          i === index ? { ...link, [field]: value } : link
        )
      };
      
      // Trigger change detection with the updated data
      if (profile) {
        setTimeout(() => {
          checkForChangesWithData(newFormData);
        }, 0);
      }
      
      return newFormData;
    });
  };

  const handleCancelEdit = () => {
    if (profile) {
      // Reset form data to original profile state
      setFormData({
        alias: profile.alias || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        contact_phone: profile.contact_phone || '',
        bio: profile.bio || '',
        mailing_address: profile.mailing_address || '',
        links: profile.links || [],
      });
    }
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Check for changes more comprehensively
    if (profile) {
      setTimeout(() => {
        checkForChanges();
      }, 0);
    }
  };

  const checkForChanges = () => {
    if (!profile) return;
    
    // Helper function to compare link arrays
    const linksChanged = () => {
      const currentLinks = profile.links || [];
      const formLinks = formData.links;
      
      if (currentLinks.length !== formLinks.length) return true;
      
      return !currentLinks.every((currentLink, index) => {
        const formLink = formLinks[index];
        return formLink && 
               currentLink.platform === formLink.platform && 
               currentLink.url === formLink.url;
      });
    };
    
    const hasFormChanges = 
      formData.alias !== (profile.alias || '') ||
      formData.first_name !== (profile.first_name || '') ||
      formData.last_name !== (profile.last_name || '') ||
      formData.contact_phone !== (profile.contact_phone || '') ||
      formData.bio !== (profile.bio || '') ||
      formData.mailing_address !== (profile.mailing_address || '') ||
      linksChanged();
    
    setHasChanges(hasFormChanges);
  };

  const checkForChangesWithData = (customFormData: typeof formData) => {
    if (!profile) return;
    
    // Helper function to compare link arrays
    const linksChanged = () => {
      const currentLinks = profile.links || [];
      const formLinks = customFormData.links;
      
      if (currentLinks.length !== formLinks.length) return true;
      
      return !currentLinks.every((currentLink, index) => {
        const formLink = formLinks[index];
        return formLink && 
               currentLink.platform === formLink.platform && 
               currentLink.url === formLink.url;
      });
    };
    
    const hasFormChanges = 
      customFormData.alias !== (profile.alias || '') ||
      customFormData.first_name !== (profile.first_name || '') ||
      customFormData.last_name !== (profile.last_name || '') ||
      customFormData.contact_phone !== (profile.contact_phone || '') ||
      customFormData.bio !== (profile.bio || '') ||
      customFormData.mailing_address !== (profile.mailing_address || '') ||
      linksChanged();
    
    setHasChanges(hasFormChanges);
  };

  const handleSaveChanges = async () => {
    if (!hasChanges || !profile) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const response = await profileService.updateProfile(formData);
      
      if (response.success && response.profile) {
        setProfile(response.profile);
        setHasChanges(false);
        setIsEditing(false);
      } else {
        setError(response.message || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Failed to save changes:', error);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'profile' | 'banner') => {
    const setUploading = type === 'profile' ? setIsUploadingProfile : setIsUploadingBanner;
    
    try {
      setUploading(true);
      setError(null);
      
      const response = await profileService.uploadImage(file, type);
      
      if (response.success && response.data && profile) {
        const updatedProfile = {
          ...profile,
          [type === 'profile' ? 'image_url' : 'banner_url']: response.data.url
        };
        setProfile(updatedProfile);
      } else {
        setError(response.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file, type);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading profile</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={loadProfile}
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Banner Section */}
        <div className="relative h-64 bg-gradient-to-r from-indigo-500 to-purple-600 overflow-hidden">
          {profile?.banner_url ? (
            <img 
              src={profile.banner_url} 
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600" />
          )}
          
          {/* Banner Upload Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 group cursor-pointer">
            <label className="cursor-pointer w-full h-full flex items-center justify-center">
              <div className="hidden group-hover:flex items-center justify-center bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
                {isUploadingBanner ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Change Banner
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'banner')}
                className="hidden"
                disabled={isUploadingBanner}
              />
            </label>
          </div>
        </div>

        {/* Profile Section */}
        <div className="relative px-6 pb-6">
          <div className="max-w-4xl mx-auto">
            {/* Profile Image and Basic Info */}
            <div className="relative -mt-8 mb-6">
              <div className="flex items-end space-x-4">
                {/* Profile Image */}
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                    {profile?.image_url ? (
                      <img 
                        src={profile.image_url} 
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center text-white text-3xl font-medium">
                        {profile?.initials || 'U'}
                      </div>
                    )}
                  </div>
                  
                  {/* Profile Image Upload Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 rounded-full group-hover:bg-opacity-30 cursor-pointer">
                    <label className="cursor-pointer w-full h-full flex items-center justify-center rounded-full">
                      <div className="hidden group-hover:flex items-center justify-center bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm">
                        {isUploadingProfile ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Change
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'profile')}
                        className="hidden"
                        disabled={isUploadingProfile}
                      />
                    </label>
                  </div>
                </div>

                {/* Name and Alias */}
                <div className="flex-1 pb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{profile?.display_name}</h1>
                  <p className="text-lg text-gray-600 mt-1">@{profile?.alias}</p>
                  {profile?.bio && (
                    <p className="text-gray-700 mt-2 max-w-2xl">{profile.bio}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === 'details'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Profile Details
                  </button>
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === 'posts'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Venue Posts
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Edit Toggle */}
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                      <button
                        onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
                        className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors duration-200"
                      >
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                      </button>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Alias */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Alias
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.alias}
                            onChange={(e) => handleInputChange('alias', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter your alias"
                          />
                        ) : (
                          <p className="px-3 py-2 text-gray-900 bg-gray-50 rounded-md">
                            {profile?.alias || 'Not set'}
                          </p>
                        )}
                      </div>

                      {/* Email (read-only) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <p className="px-3 py-2 text-gray-500 bg-gray-50 rounded-md">
                          {user?.email}
                        </p>
                      </div>

                      {/* First Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.first_name}
                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter your first name"
                          />
                        ) : (
                          <p className="px-3 py-2 text-gray-900 bg-gray-50 rounded-md">
                            {profile?.first_name || 'Not set'}
                          </p>
                        )}
                      </div>

                      {/* Last Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.last_name}
                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter your last name"
                          />
                        ) : (
                          <p className="px-3 py-2 text-gray-900 bg-gray-50 rounded-md">
                            {profile?.last_name || 'Not set'}
                          </p>
                        )}
                      </div>

                      {/* Contact Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Phone
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={formData.contact_phone}
                            onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter your phone number"
                          />
                        ) : (
                          <p className="px-3 py-2 text-gray-900 bg-gray-50 rounded-md">
                            {profile?.contact_phone || 'Not set'}
                          </p>
                        )}
                      </div>

                      {/* Mailing Address */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mailing Address
                        </label>
                        {isEditing ? (
                          <textarea
                            value={formData.mailing_address}
                            onChange={(e) => handleInputChange('mailing_address', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter your mailing address"
                          />
                        ) : (
                          <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-md min-h-[80px]">
                            {profile?.mailing_address || 'Not set'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Links Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Social Links
                        </label>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={addLink}
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                          >
                            + Add Link
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        {formData.links.length === 0 ? (
                          <div className="px-3 py-2 text-gray-500 bg-gray-50 rounded-md text-center">
                            No links added yet
                            {isEditing && (
                              <button
                                type="button"
                                onClick={addLink}
                                className="ml-2 text-indigo-600 hover:text-indigo-500"
                              >
                                Add your first link
                              </button>
                            )}
                          </div>
                        ) : (
                          formData.links.map((link, index) => {
                            const platform = getPlatformById(link.platform);
                            return (
                              <div key={index} className="border border-gray-200 rounded-md p-3">
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={link.platform}
                                        onChange={(e) => updateLink(index, 'platform', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    {platform && (
                                      <div 
                                        className="w-5 h-5 flex-shrink-0"
                                        dangerouslySetInnerHTML={{ __html: platform.icon }}
                                      />
                                    )}
                                    <div className="flex-1">
                                      <div className="text-xs font-medium text-gray-600 mb-1">
                                        {platform ? platform.name : 'Unknown Platform'}
                                      </div>
                                      <a 
                                        href={link.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-indigo-600 hover:text-indigo-500 break-all"
                                      >
                                        {link.url}
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      {isEditing ? (
                        <textarea
                          value={formData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Tell us about yourself..."
                        />
                      ) : (
                        <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-md min-h-[100px]">
                          {profile?.bio || 'add bio'}
                        </div>
                      )}
                    </div>

                    {/* Save Button */}
                    {hasChanges && isEditing && (
                      <div className="flex justify-end pt-4 border-t border-gray-200">
                        <button
                          onClick={handleSaveChanges}
                          disabled={isSaving}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200 flex items-center"
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
                            'Save Changes'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'posts' && (
                  <div className="space-y-6">
                    {/* Posts Header */}
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Venue Hub Posts</h3>
                      <div className="text-sm text-gray-500">
                        12 posts
                      </div>
                    </div>

                    {/* Posts Grid */}
                    <div className="grid gap-6">
                      {/* Sample Post 1 */}
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
                        <div className="aspect-video bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                          <div className="text-white text-center">
                            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <p className="text-sm">Venue Image</p>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">Grand Ballroom - Downtown</h4>
                            <span className="text-xs text-gray-500">2 days ago</span>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">
                            Beautiful ballroom venue perfect for weddings and corporate events. Features elegant chandeliers, hardwood floors, and capacity for 200 guests.
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                24 likes
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                8 comments
                              </span>
                            </div>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
                          </div>
                        </div>
                      </div>

                      {/* Sample Post 2 */}
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
                        <div className="aspect-video bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                          <div className="text-white text-center">
                            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm">Garden Venue</p>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">Sunset Garden Pavilion</h4>
                            <span className="text-xs text-gray-500">1 week ago</span>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">
                            Outdoor garden venue with stunning sunset views. Perfect for intimate ceremonies and receptions. Features covered pavilion and landscaped gardens.
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                18 likes
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                5 comments
                              </span>
                            </div>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
                          </div>
                        </div>
                      </div>

                      {/* Sample Post 3 */}
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
                        <div className="aspect-video bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center">
                          <div className="text-white text-center">
                            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                            </svg>
                            <p className="text-sm">Event Hall</p>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">Modern Event Hall</h4>
                            <span className="text-xs text-gray-500">2 weeks ago</span>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">
                            Contemporary event space with state-of-the-art audio/visual equipment. Ideal for conferences, product launches, and corporate events.
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                31 likes
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                12 comments
                              </span>
                            </div>
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Pending</span>
                          </div>
                        </div>
                      </div>

                      {/* Empty State for More Posts */}
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p className="text-sm">No more posts to show</p>
                        <p className="text-xs mt-1">Share your venue to see it here!</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}