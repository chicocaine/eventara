import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { LoginCredentials, RegisterCredentials, RegisterWithPrivacyCredentials, AuthResponse, User, PasswordResetResponse, ProfileSetupRequest, ProfileSetupResponse } from '../types/auth.js';
import { settingsService, getDefaultUserSettings, type UserSettings } from './settingsService.js';

// Set up axios defaults
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;

// Get CSRF token from meta tag
const getCSRFToken = (): string => {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (token) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
    return token;
  }
  console.warn('CSRF token not found');
  return '';
};

// Initialize CSRF token
getCSRFToken();

// Helper to extract structured auth error info
const parseAuthError = (error: any) => {
  const status = error?.response?.status;
  const data = error?.response?.data || {};
  return { status, data };
};

// Set up a response interceptor once here (AuthContext also attaches one to update state)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status } = parseAuthError(error);
    // Just pass through; state handling is done in AuthContext
    if (status === 401 || status === 403 || status === 419) {
      // Optionally log
      // console.debug('Auth-related HTTP status caught:', status);
    }
    return Promise.reject(error);
  }
);

class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('Attempting login to:', `/api/auth/login`);
      
      const response: AxiosResponse<AuthResponse> = await axios.post(`/api/auth/login`, {
        email: credentials.email,
        password: credentials.password,
        remember: credentials.remember || false,
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });

      console.log('Login response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config);
      
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
   * Register new user
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      console.log('Attempting register to:', `/api/auth/register`);
      
      const response: AxiosResponse<AuthResponse> = await axios.post(`/api/auth/register`, {
        email: credentials.email,
        password: credentials.password,
        password_confirmation: credentials.password_confirmation,
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });

      console.log('Register response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Register error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config);
      
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
   * Register new user with privacy preferences
   */
  async registerWithPrivacy(credentials: RegisterWithPrivacyCredentials): Promise<AuthResponse> {
    try {
      console.log('Attempting register with privacy settings to:', `/api/auth/register`);
      
      // First register the user
      const registerResponse = await this.register({
        email: credentials.email,
        password: credentials.password,
        password_confirmation: credentials.password_confirmation,
      });

      // If registration is successful, initialize privacy settings
      if (registerResponse.success && registerResponse.user) {
        try {
          const defaultSettings = getDefaultUserSettings();
          const userSettings: UserSettings = credentials.privacy_settings 
            ? {
                dark_mode: credentials.privacy_settings.dark_mode ?? defaultSettings.dark_mode,
                notifications: {
                  ...defaultSettings.notifications,
                  ...credentials.privacy_settings.notifications,
                },
                privacy: {
                  ...defaultSettings.privacy,
                  ...credentials.privacy_settings.privacy,
                },
              }
            : defaultSettings;
            
          const settingsResponse = await settingsService.initializeUserSettings(userSettings);
          
          if (!settingsResponse.success) {
            console.warn('Failed to initialize privacy settings, but registration successful');
          }
        } catch (settingsError) {
          console.warn('Failed to initialize privacy settings:', settingsError);
          // Don't fail the entire registration if settings fail
        }
      }

      return registerResponse;
    } catch (error: any) {
      console.error('Register with privacy error:', error);
      
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
   * Handle Google OAuth registration with default privacy settings
   */
  async handleGoogleOAuthRegistration(googleUser: any): Promise<AuthResponse> {
    try {
      console.log('Handling Google OAuth registration');
      
      // This would be called after Google OAuth success
      // Initialize with privacy-focused defaults for OAuth users
      const defaultSettings = getDefaultUserSettings();
      
      try {
        await settingsService.initializeUserSettings(defaultSettings);
      } catch (settingsError) {
        console.warn('Failed to initialize privacy settings for Google OAuth user:', settingsError);
      }

      // Return a success response - the actual OAuth flow would be handled differently
      return {
        success: true,
        user: googleUser,
        message: 'Google OAuth registration successful'
      };
    } catch (error: any) {
      console.error('Google OAuth registration error:', error);
      
      return {
        success: false,
        message: 'Failed to complete Google OAuth registration',
        errors: { general: ['OAuth registration failed'] }
      };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await axios.post(`/api/auth/logout`, {}, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
    } catch (error) {
      // Even if logout fails on server, clear client-side state
      console.warn('Logout request failed, but proceeding with client-side logout');
    }
  }

  /**
   * Check authentication status
   */
  async checkAuth(): Promise<{ authenticated: boolean; user?: User }> {
    try {
      const response = await axios.get(`/api/auth/check`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });

      return response.data;
    } catch (error) {
      console.warn('Auth check failed:', error);
      return { authenticated: false };
    }
  }

  /**
   * Send password reset code to email
   */
  async forgotPassword(email: string): Promise<PasswordResetResponse> {
    try {
      console.log('Attempting forgot password to:', `/api/password-reset/send-code`);
      
      const response: AxiosResponse<PasswordResetResponse> = await axios.post(`/api/password-reset/send-code`, {
        email,
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });

      console.log('Forgot password response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Forgot password error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
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
   * Reset password with code
   */
  async resetPassword(email: string, code: string, password: string, passwordConfirmation: string): Promise<PasswordResetResponse> {
    try {
      console.log('Attempting reset password to:', `/api/password-reset/reset-password`);
      
      const response: AxiosResponse<PasswordResetResponse> = await axios.post(`/api/password-reset/reset-password`, {
        email,
        code,
        password,
        password_confirmation: passwordConfirmation,
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });

      console.log('Reset password response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Reset password error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
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
   * Setup user profile after registration
   */
  async setupProfile(profileData: ProfileSetupRequest): Promise<ProfileSetupResponse> {
    try {
      console.log('Attempting profile setup to:', `/api/profile/setup`);
      
      const response: AxiosResponse<ProfileSetupResponse> = await axios.post(`/api/profile/setup`, profileData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });

      console.log('Profile setup response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Profile setup error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
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
   * Skip profile setup and create default profile
   */
  async skipProfileSetup(): Promise<ProfileSetupResponse> {
    try {
      console.log('Attempting skip profile setup to:', `/api/profile/skip-setup`);
      
      const response: AxiosResponse<ProfileSetupResponse> = await axios.post(`/api/profile/skip-setup`, {}, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });

      console.log('Skip profile setup response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Skip profile setup error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
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
   * Get fresh CSRF token
   */
  async refreshCSRF(): Promise<void> {
    try {
      await axios.get('/sanctum/csrf-cookie');
      getCSRFToken();
    } catch (error) {
      console.warn('Failed to refresh CSRF token');
    }
  }
}

export const authService = new AuthService();
export default authService;