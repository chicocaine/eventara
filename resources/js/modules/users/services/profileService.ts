import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { UserProfile, FileUploadResponse } from '../types/auth.js';

interface GetProfileResponse {
  success: boolean;
  message: string;
  profile?: UserProfile;
  errors?: Record<string, string[]>;
}

interface UpdateProfileRequest {
  alias: string;
  first_name?: string;
  last_name?: string;
  contact_phone?: string;
  age_group?: string;
  gender?: string;
  occupation?: string;
  education_level?: string;
  bio?: string;
  mailing_address?: string;
  links?: Array<{
    platform: string;
    url: string;
  }>;
}

interface UpdateProfileResponse {
  success: boolean;
  message: string;
  profile?: UserProfile;
  errors?: Record<string, string[]>;
}

class ProfileService {
  private baseURL = '/api/profile';

  /**
   * Get current user's profile
   */
  async getProfile(): Promise<GetProfileResponse> {
    try {
      console.log('Fetching user profile...');
      
      const response: AxiosResponse<GetProfileResponse> = await axios.get(`${this.baseURL}`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });

      console.log('Profile response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Get profile error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        message: `Network error occurred (${error.response?.status || 'Unknown'}). Please try again.`,
        errors: { general: ['Unable to connect to server'] }
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    try {
      console.log('Updating profile...', profileData);
      
      const response: AxiosResponse<UpdateProfileResponse> = await axios.put(`${this.baseURL}`, profileData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });

      console.log('Update profile response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Update profile error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        message: `Network error occurred (${error.response?.status || 'Unknown'}). Please try again.`,
        errors: { general: ['Unable to connect to server'] }
      };
    }
  }

  /**
   * Upload profile or banner image
   */
  async uploadImage(file: File, type: 'profile' | 'banner'): Promise<FileUploadResponse> {
    try {
      console.log(`Uploading ${type} image...`);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response: AxiosResponse<FileUploadResponse> = await axios.post(`${this.baseURL}/upload-image`, formData, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'multipart/form-data',
        }
      });

      console.log('Upload image response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Upload image error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        message: `Network error occurred (${error.response?.status || 'Unknown'}). Please try again.`,
        errors: { general: ['Unable to connect to server'] }
      };
    }
  }
}

export const profileService = new ProfileService();
export type { GetProfileResponse, UpdateProfileRequest, UpdateProfileResponse };