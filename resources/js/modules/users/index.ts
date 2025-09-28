// Pages
export { default as LoginPage } from './pages/LoginPage.js';
export { default as RegisterPage } from './pages/RegisterPage.js';
export { default as DashboardPage } from './pages/DashboardPage.js';

// Components
export { default as LoginForm } from './components/LoginForm.js';
export { default as RegisterForm } from './components/RegisterForm.js';
export { default as ProtectedRoute } from './components/ProtectedRoute.js';

// Contexts & Providers
export { AuthProvider, useAuth } from './contexts/AuthContext.js';

// Hooks
export { useAuth as useAuthHook } from './hooks/useAuth.js';

// Services
export { authService } from './services/authService.js';

// Types
export type { 
  User, 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResponse, 
  ValidationError, 
  AuthContextType 
} from './types/auth.js';