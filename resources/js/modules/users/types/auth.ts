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

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  redirect_url?: string;
  needs_reactivation?: boolean;
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
  isLoading: boolean;
  isAuthenticated: boolean;
}