import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { LoginCredentials, RegisterCredentials, AuthResponse, User, PasswordResetResponse } from '../types/auth.js';

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