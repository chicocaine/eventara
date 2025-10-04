export interface User {
  id: number;
  email: string;
  display_name: string;
  name?: string; // For Google OAuth
  avatar?: string; // For Google OAuth profile picture
  role?: string;
  active?: boolean;
  is_volunteer?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  password_confirmation: string;
}

export interface RegisterWithPrivacyCredentials extends RegisterCredentials {
  privacy_settings?: {
    dark_mode?: boolean;
    notifications?: {
      email_notifications?: boolean;
      push_notifications?: boolean;
      event_reminders?: boolean;
      venue_updates?: boolean;
      security_alerts?: boolean;
    };
    privacy?: {
      profile_visibility?: 'public' | 'private' | 'friends';
      show_online_status?: boolean;
      allow_friend_requests?: boolean;
      show_activity_status?: boolean;
      data_collection_consent?: boolean;
      marketing_emails_consent?: boolean;
    };
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
}

export interface UserPreferences {
  darkmode: boolean;
  email_notifications: {
    event_updates: boolean;
    volunteer_opportunities: boolean;
    newsletter: boolean;
    account_security: boolean;
    marketing: boolean;
  };
}

export interface ProfileSetupRequest {
  alias: string;
  first_name?: string;
  last_name?: string;
  contact_phone?: string;
  mailing_address?: string;
  image_url?: string;
  banner_url?: string;
  bio?: string;
  links?: Array<{
    platform: string;
    url: string;
  }>;
  preferences?: UserPreferences;
}

export interface ProfileSetupResponse {
  success: boolean;
  message: string;
  user?: User;
  profile?: UserProfile;
  errors?: Record<string, string[]>;
}

export interface UserProfile {
  id: number;
  user_id: number;
  alias: string;
  first_name?: string;
  last_name?: string;
  image_url?: string;
  banner_url?: string;
  contact_phone?: string;
  bio?: string;
  mailing_address?: string;
  links?: Array<{
    platform: string;
    url: string;
  }>;
  preferences?: UserPreferences;
  certifika_wallet?: string;
  full_name?: string;
  display_name: string;
  initials: string;
}

export interface FileUploadResponse {
  success: boolean;
  message: string;
  data?: {
    url: string;
    filename: string;
    type: string;
  };
  errors?: Record<string, string[]>;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  redirect_url?: string;
  needs_reactivation?: boolean;
  errors?: Record<string, string[]>;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  expires_at?: string;
  remaining_attempts?: number;
  errors?: Record<string, string[]>;
}

export interface ValidationError {
  message: string;
  errors: Record<string, string[]>;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (credentials: RegisterCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<PasswordResetResponse>;
  resetPassword: (email: string, code: string, password: string, passwordConfirmation: string) => Promise<PasswordResetResponse>;
  setupProfile: (profileData: ProfileSetupRequest) => Promise<ProfileSetupResponse>;
  skipProfileSetup: () => Promise<ProfileSetupResponse>;
  isLoading: boolean;
  isAuthenticated: boolean;
}