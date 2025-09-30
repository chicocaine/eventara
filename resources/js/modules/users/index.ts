// Pages
export { default as LoginPage } from './pages/LoginPage.js';
export { default as RegisterPage } from './pages/RegisterPage.js';
export { default as DashboardPage } from './pages/DashboardPage.js';
export { default as ReactivationPage } from './pages/ReactivationPage.js';

// Components
export { default as LoginForm } from './components/LoginForm.js';
export { default as RegisterForm } from './components/RegisterForm.js';
export { default as ForgotPasswordForm } from './components/ForgotPasswordForm.js';
export { default as ResetPasswordForm } from './components/ResetPasswordForm.js';
export { default as ProfileSetupForm } from './components/ProfileSetupForm.js';
export { default as ProtectedRoute } from './components/ProtectedRoute.js';
export { default as ReactivationPageComponent } from './components/ReactivationPage.js';


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
  AuthContextType 
} from './types/auth.js';