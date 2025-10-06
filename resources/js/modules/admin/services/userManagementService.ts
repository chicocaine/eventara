import axios from 'axios';
import type { AxiosResponse } from 'axios';

// Set up axios defaults
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;

// Types for user management
export interface User {
  id: number;
  email: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  alias?: string;
  role: string;
  active: boolean;
  suspended: boolean;
  can_login: boolean;
  is_volunteer: boolean;
  last_login?: string;
  created_at: string;
  updated_at?: string;
  email_verified_at?: string;
  auth_provider?: string;
  // Demographics
  age_group?: string;
  gender?: string;
  occupation?: string;
  education_level?: string;
}

export interface UserListResponse {
  success: boolean;
  data: User[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export interface UserStats {
  total_users: number;
  active_users: number;
  suspended_users: number;
  inactive_users: number;
  new_this_week: number;
  users_by_role: Record<string, number>;
  login_activity: {
    last_24h: number;
    last_week: number;
    last_month: number;
  };
  demographics: {
    age_groups: Record<string, number>;
    genders: Record<string, number>;
    occupations: Record<string, number>;
    education_levels: Record<string, number>;
  };
}

export interface UserStatsResponse {
  success: boolean;
  stats: UserStats;
}

export interface UserActionResponse {
  success: boolean;
  message: string;
  user?: Partial<User>;
}

export interface UserListFilters {
  search?: string;
  role?: string;
  status?: string;
  age_group?: string;
  gender?: string;
  occupation?: string;
  education_level?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

class UserManagementService {
  private baseURL = '/api/admin/users';

  /**
   * Get list of users with filtering, sorting, and pagination
   */
  async getUsers(filters: UserListFilters = {}): Promise<UserListResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response: AxiosResponse<UserListResponse> = await axios.get(
        `${this.baseURL}?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Get users error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStatsResponse> {
    try {
      const response: AxiosResponse<UserStatsResponse> = await axios.get(
        `${this.baseURL}/stats`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Get user stats error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get specific user details
   */
  async getUser(userId: number): Promise<{ success: boolean; user: User }> {
    try {
      const response: AxiosResponse<{ success: boolean; user: User }> = await axios.get(
        `${this.baseURL}/${userId}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Get user error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Suspend a user
   */
  async suspendUser(userId: number): Promise<UserActionResponse> {
    try {
      const response: AxiosResponse<UserActionResponse> = await axios.post(
        `${this.baseURL}/${userId}/suspend`,
        {},
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Suspend user error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Unsuspend a user
   */
  async unsuspendUser(userId: number): Promise<UserActionResponse> {
    try {
      const response: AxiosResponse<UserActionResponse> = await axios.post(
        `${this.baseURL}/${userId}/unsuspend`,
        {},
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Unsuspend user error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Deactivate a user
   */
  async deactivateUser(userId: number): Promise<UserActionResponse> {
    try {
      const response: AxiosResponse<UserActionResponse> = await axios.post(
        `${this.baseURL}/${userId}/deactivate`,
        {},
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Deactivate user error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Activate a user
   */
  async activateUser(userId: number): Promise<UserActionResponse> {
    try {
      const response: AxiosResponse<UserActionResponse> = await axios.post(
        `${this.baseURL}/${userId}/activate`,
        {},
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Activate user error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: number, role: string): Promise<UserActionResponse> {
    try {
      const response: AxiosResponse<UserActionResponse> = await axios.put(
        `${this.baseURL}/${userId}/role`,
        { role },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Update user role error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || `HTTP ${error.response.status}: ${error.response.statusText}`;
      return new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error: No response from server');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

// Export singleton instance
export const userManagementService = new UserManagementService();
export default userManagementService;