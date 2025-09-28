import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { LoginCredentials, RegisterCredentials, AuthResponse, User } from '../types/auth.js';

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
  private baseURL = '';

  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await axios.post(`${this.baseURL}/login`, {
        email: credentials.email,
        password: credentials.password,
        remember: credentials.remember || false,
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        message: 'Network error occurred. Please try again.',
        errors: { general: ['Unable to connect to server'] }
      };
    }
  }

  /**
   * Register new user
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await axios.post(`${this.baseURL}/register`, {
        email: credentials.email,
        password: credentials.password,
        password_confirmation: credentials.password_confirmation,
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        message: 'Network error occurred. Please try again.',
        errors: { general: ['Unable to connect to server'] }
      };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/logout`, {}, {
        headers: {
          'Accept': 'application/json',
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
      const response = await axios.get(`${this.baseURL}/api/auth/check`, {
        headers: {
          'Accept': 'application/json',
        }
      });

      return response.data;
    } catch (error) {
      return { authenticated: false };
    }
  }

  /**
   * Get fresh CSRF token
   */
  async refreshCSRF(): Promise<void> {
    try {
      await axios.get(`${this.baseURL}/sanctum/csrf-cookie`);
      getCSRFToken();
    } catch (error) {
      console.warn('Failed to refresh CSRF token');
    }
  }
}

export const authService = new AuthService();
export default authService;