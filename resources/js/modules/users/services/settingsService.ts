interface UserSettings {
  dark_mode: boolean;
  notifications: {
    email_notifications: boolean;
    push_notifications: boolean;
    event_reminders: boolean;
    venue_updates: boolean;
    security_alerts: boolean;
  };
  privacy: {
    profile_visibility: 'public' | 'private' | 'friends';
    show_online_status: boolean;
    allow_friend_requests: boolean;
    show_activity_status: boolean;
    data_collection_consent: boolean;
    marketing_emails_consent: boolean;
  };
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Default privacy settings for new users
const getDefaultUserSettings = (): UserSettings => ({
  dark_mode: false,
  notifications: {
    email_notifications: true,
    push_notifications: false, // Default to false for privacy
    event_reminders: true,
    venue_updates: false,
    security_alerts: true, // Always true for security
  },
  privacy: {
    profile_visibility: 'public', // Default to public but user can change
    show_online_status: false, // Default to private for privacy
    allow_friend_requests: true,
    show_activity_status: false, // Default to private
    data_collection_consent: false, // Must be explicitly opted in
    marketing_emails_consent: false, // Must be explicitly opted in
  },
});

// Privacy-focused defaults for users who prefer more privacy
const getPrivacyFocusedDefaults = (): UserSettings => ({
  dark_mode: false,
  notifications: {
    email_notifications: true,
    push_notifications: false,
    event_reminders: true,
    venue_updates: false,
    security_alerts: true,
  },
  privacy: {
    profile_visibility: 'friends', // More private default
    show_online_status: false,
    allow_friend_requests: true,
    show_activity_status: false,
    data_collection_consent: false,
    marketing_emails_consent: false,
  },
});

class SettingsService {
  private baseUrl = '/api/user/settings';

  async getSettings(): Promise<ApiResponse<UserSettings>> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to fetch settings'
        };
      }

      return {
        success: true,
        data: data.settings
      };
    } catch (error) {
      console.error('Settings fetch error:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  async updateSettings(settings: UserSettings): Promise<ApiResponse<UserSettings>> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ settings })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to update settings'
        };
      }

      return {
        success: true,
        data: data.settings,
        message: 'Settings updated successfully'
      };
    } catch (error) {
      console.error('Settings update error:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  async deactivateAccount(confirmationText: string): Promise<ApiResponse> {
    try {
      const response = await fetch('/api/user/deactivate', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ confirmation: confirmationText })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to deactivate account'
        };
      }

      return {
        success: true,
        message: 'Account deactivated successfully'
      };
    } catch (error) {
      console.error('Account deactivation error:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  async deleteAccount(confirmationText: string): Promise<ApiResponse> {
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ confirmation: confirmationText })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to delete account'
        };
      }

      return {
        success: true,
        message: 'Account deleted successfully'
      };
    } catch (error) {
      console.error('Account deletion error:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  async reactivateAccount(email: string, password: string): Promise<ApiResponse> {
    try {
      const response = await fetch('/api/user/reactivate', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to reactivate account'
        };
      }

      return {
        success: true,
        data: data.user,
        message: 'Account reactivated successfully'
      };
    } catch (error) {
      console.error('Account reactivation error:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  async initializeUserSettings(customSettings?: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    try {
      const defaultSettings = getDefaultUserSettings();
      const settings = customSettings ? { ...defaultSettings, ...customSettings } : defaultSettings;

      const response = await fetch(`${this.baseUrl}/initialize`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ settings })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to initialize user settings'
        };
      }

      return {
        success: true,
        data: data.settings,
        message: 'User settings initialized successfully'
      };
    } catch (error) {
      console.error('Settings initialization error:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }
}

export const settingsService = new SettingsService();
export type { UserSettings, ApiResponse };
export { getDefaultUserSettings, getPrivacyFocusedDefaults };