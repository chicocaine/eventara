import React from 'react';
import type { UserProfile } from '../types/auth.js';
import { AVAILABLE_PLATFORMS, getPlatformById } from '../../../shared/config/platforms.js';

interface Link {
  platform: string;
  url: string;
}

interface FormData {
  alias: string;
  first_name: string;
  last_name: string;
  contact_phone: string;
  bio: string;
  mailing_address: string;
  links: Link[];
}

interface ProfileDetailsTabProps {
  profile: UserProfile | null;
  userEmail?: string | undefined;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  hasChanges: boolean;
  isSaving: boolean;
  formData: FormData;
  onInputChange: (field: string, value: string) => void;
  onSaveChanges: () => Promise<void>;
  onCancelEdit: () => void;
  onAddLink: () => void;
  onRemoveLink: (index: number) => void;
  onUpdateLink: (index: number, field: 'platform' | 'url', value: string) => void;
}

export default function ProfileDetailsTab({
  profile,
  userEmail,
  isEditing,
  setIsEditing,
  hasChanges,
  isSaving,
  formData,
  onInputChange,
  onSaveChanges,
  onCancelEdit,
  onAddLink,
  onRemoveLink,
  onUpdateLink,
}: ProfileDetailsTabProps) {
  return (
    <div className="space-y-6">
      {/* Edit Toggle */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
        <button
          onClick={() => isEditing ? onCancelEdit() : setIsEditing(true)}
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
              onChange={(e) => onInputChange('alias', e.target.value)}
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
            {userEmail || 'Not available'}
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
              onChange={(e) => onInputChange('first_name', e.target.value)}
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
              onChange={(e) => onInputChange('last_name', e.target.value)}
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
              onChange={(e) => onInputChange('contact_phone', e.target.value)}
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
              onChange={(e) => onInputChange('mailing_address', e.target.value)}
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
              onClick={onAddLink}
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
                  onClick={onAddLink}
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
                          onChange={(e) => onUpdateLink(index, 'platform', e.target.value)}
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
                          onClick={() => onRemoveLink(index)}
                          className="px-2 py-2 text-red-600 hover:text-red-500"
                          title="Remove link"
                        >
                          ✕
                        </button>
                      </div>
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => onUpdateLink(index, 'url', e.target.value)}
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
            onChange={(e) => onInputChange('bio', e.target.value)}
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
            onClick={onSaveChanges}
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
  );
}