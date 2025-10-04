import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../../shared/layouts/index.js';
import { useAuth } from '../hooks/useAuth.js';
import type { UserProfile, FileUploadResponse } from '../types/auth.js';
import { profileService } from '../services/profileService.js';
import { certifikaService } from '../services/certifikaService.js';
import type { CertifikaProfile, CertifikaResponse } from '../services/certifikaService.js';
import ProfileDetailsTab from '../components/ProfileDetailsTab.js';
import VenuePostsTab from '../components/VenuePostsTab.js';
import CertifikaTab from '../components/CertifikaTab.js';

interface ProfilePageProps {}

export default function ProfilePage({}: ProfilePageProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'posts' | 'certifika'>('details');
  
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

  // Certifika states
  const [certifikaProfile, setCertifikaProfile] = useState<CertifikaProfile | null>(null);
  const [certifikaLoading, setCertifikaLoading] = useState(false);
  const [certifikaError, setCertifikaError] = useState<string | null>(null);
  const [certifikaTab, setCertifikaTab] = useState<'gallery' | 'scanner'>('gallery');
  const [showCertifikaSuccess, setShowCertifikaSuccess] = useState(false);
  const [certifikaConnected, setCertifikaConnected] = useState(false);
  const [certifikaNfts, setCertifikaNfts] = useState([]);
  const [showQrScanner, setShowQrScanner] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    // Load Certifika profile when the certifika tab is active
    if (activeTab === 'certifika') {
      loadCertifikaProfile();
    }
  }, [activeTab]);

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

  const loadCertifikaProfile = async () => {
    try {
      setCertifikaLoading(true);
      setCertifikaError(null);
      
      const response: CertifikaResponse<CertifikaProfile> = await certifikaService.getUserProfile();
      
      if (response.success && response.data) {
        setCertifikaProfile(response.data);
        
        // If user doesn't have a wallet linked, show scanner tab by default
        if (!response.data.has_certifika_wallet) {
          setCertifikaTab('scanner');
        }
      } else {
        setCertifikaError(response.message || 'Failed to load Certifika profile');
      }
    } catch (error) {
      console.error('Error loading Certifika profile:', error);
      setCertifikaError('Failed to load Certifika profile');
    } finally {
      setCertifikaLoading(false);
    }
  };

  const handleCertifikaQrSuccess = async (result: any) => {
    setShowCertifikaSuccess(true);
    
    // Reload profile to get updated wallet info
    await loadCertifikaProfile();
    
    // Switch to gallery tab to show NFTs
    setCertifikaTab('gallery');
    
    // Hide success message after 5 seconds
    setTimeout(() => setShowCertifikaSuccess(false), 5000);
  };

  const handleCertifikaQrError = (errorMessage: string) => {
    setCertifikaError(errorMessage);
    setTimeout(() => setCertifikaError(null), 5000);
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
                  <button
                    onClick={() => setActiveTab('certifika')}
                    className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === 'certifika'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Certifika
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'details' && (
                  <ProfileDetailsTab
                    profile={profile}
                    userEmail={user?.email}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    hasChanges={hasChanges}
                    isSaving={isSaving}
                    formData={formData}
                    onInputChange={handleInputChange}
                    onSaveChanges={handleSaveChanges}
                    onCancelEdit={handleCancelEdit}
                    onAddLink={addLink}
                    onRemoveLink={removeLink}
                    onUpdateLink={updateLink}
                  />
                )}

                {activeTab === 'posts' && (
                  <VenuePostsTab />
                )}

                {/* Certifika Tab Content */}
                {activeTab === 'certifika' && (
                  <CertifikaTab
                    certifikaProfile={certifikaProfile}
                    certifikaLoading={certifikaLoading}
                    certifikaError={certifikaError}
                    certifikaConnected={certifikaConnected}
                    showQrScanner={showQrScanner}
                    setShowQrScanner={setShowQrScanner}
                    onQrSuccess={handleCertifikaQrSuccess}
                    onQrError={handleCertifikaQrError}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}