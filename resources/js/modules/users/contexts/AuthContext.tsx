import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextType, User, LoginCredentials, RegisterCredentials, AuthResponse, PasswordResetResponse, ProfileSetupRequest, ProfileSetupResponse } from '../types/auth.js';
import { authService } from '../services/authService.js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const response = await authService.checkAuth();
      
      if (response.authenticated && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      
      if (response.success && response.user) {
        setUser(response.user);
      }
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.',
        errors: { general: ['An unexpected error occurred'] }
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.register(credentials);
      
      if (response.success && response.user) {
        setUser(response.user);
      }
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.',
        errors: { general: ['An unexpected error occurred'] }
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear user state even if server request fails
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<PasswordResetResponse> => {
    try {
      return await authService.forgotPassword(email);
    } catch (error) {
      console.error('Forgot password failed:', error);
      return {
        success: false,
        message: 'Failed to send reset code. Please try again.',
        errors: { general: ['An unexpected error occurred'] }
      };
    }
  };

  const resetPassword = async (email: string, code: string, password: string, passwordConfirmation: string): Promise<PasswordResetResponse> => {
    try {
      return await authService.resetPassword(email, code, password, passwordConfirmation);
    } catch (error) {
      console.error('Reset password failed:', error);
      return {
        success: false,
        message: 'Failed to reset password. Please try again.',
        errors: { general: ['An unexpected error occurred'] }
      };
    }
  };

  const setupProfile = async (profileData: ProfileSetupRequest): Promise<ProfileSetupResponse> => {
    try {
      const response = await authService.setupProfile(profileData);
      
      // Update user in context if successful
      if (response.success && response.user) {
        setUser(response.user);
      }
      
      return response;
    } catch (error) {
      console.error('Setup profile failed:', error);
      return {
        success: false,
        message: 'Failed to setup profile. Please try again.',
        errors: { general: ['An unexpected error occurred'] }
      };
    }
  };

  const skipProfileSetup = async (): Promise<ProfileSetupResponse> => {
    try {
      const response = await authService.skipProfileSetup();
      
      // Update user in context if successful
      if (response.success && response.user) {
        setUser(response.user);
      }
      
      return response;
    } catch (error) {
      console.error('Skip profile setup failed:', error);
      return {
        success: false,
        message: 'Failed to skip profile setup. Please try again.',
        errors: { general: ['An unexpected error occurred'] }
      };
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    setupProfile,
    skipProfileSetup,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}