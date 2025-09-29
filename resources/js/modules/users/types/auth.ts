export interface User {
  id: number;
  email: string;
  display_name: string;
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

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
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
  isLoading: boolean;
  isAuthenticated: boolean;
}