// Pages
export { default as LoginPage } from './pages/auth/LoginPage.js';
export { default as RegisterPage } from './pages/auth/RegisterPage.js';
export { default as DashboardPage } from './pages/DashboardPage.js';
export { default as ReactivationPage } from './pages/auth/ReactivationPage.js';

// Auth Components
export { default as LoginForm } from './components/auth/LoginForm.js';
export { default as RegisterForm } from './components/auth/RegisterForm.js';
export { default as ForgotPasswordForm } from './components/auth/ForgotPasswordForm.js';
export { default as ResetPasswordForm } from './components/auth/ResetPasswordForm.js';
export { default as ProtectedRoute } from './components/auth/ProtectedRoute.js';

// Profile Components
export { default as ProfileSetupForm } from './components/profile/ProfileSetupForm.js';

// Contexts & Providers
export { AuthProvider, useAuth } from './contexts/AuthContext.js';

// Hooks
export { useAuth as useAuthHook } from './hooks/useAuth.js';

// Services
export { authService } from './services/authService.js';

// Types
export type { 
  User, 
  UserProfile,
  UserPreferences,
  LoginCredentials, 
  RegisterCredentials, 
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ProfileSetupRequest,
  AuthResponse, 
  PasswordResetResponse,
  ProfileSetupResponse,
  ValidationError, 
  AuthContextType,
  FileUploadResponse
} from './types/auth.js';