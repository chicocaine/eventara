import React, { useState } from 'react';
import { authService } from '../services/authService.js';
import PrivacySetup from './PrivacySetup.js';
import type { RegisterCredentials, AuthResponse } from '../types/auth.js';
import type { UserSettings } from '../services/settingsService.js';

interface RegisterWithPrivacyProps {
  onSuccess: (response: AuthResponse) => void;
  onError: (message: string) => void;
}

export default function RegisterWithPrivacy({ onSuccess, onError }: RegisterWithPrivacyProps) {
  const [step, setStep] = useState<'credentials' | 'privacy'>('credentials');
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!credentials.email || !credentials.password || !credentials.password_confirmation) {
      onError('Please fill in all fields');
      return;
    }
    
    if (credentials.password !== credentials.password_confirmation) {
      onError('Passwords do not match');
      return;
    }
    
    if (credentials.password.length < 8) {
      onError('Password must be at least 8 characters long');
      return;
    }
    
    setStep('privacy');
  };

  const handlePrivacyComplete = async (privacySettings: UserSettings) => {
    setIsLoading(true);
    
    try {
      const response = await authService.registerWithPrivacy({
        ...credentials,
        privacy_settings: privacySettings,
      });
      
      if (response.success) {
        onSuccess(response);
      } else {
        onError(response.message || 'Registration failed');
        setStep('credentials'); // Go back to credentials step
      }
    } catch (error) {
      console.error('Registration error:', error);
      onError('An unexpected error occurred. Please try again.');
      setStep('credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacySkip = async () => {
    setIsLoading(true);
    
    try {
      // Register with default settings
      const response = await authService.register(credentials);
      
      if (response.success) {
        onSuccess(response);
      } else {
        onError(response.message || 'Registration failed');
        setStep('credentials');
      }
    } catch (error) {
      console.error('Registration error:', error);
      onError('An unexpected error occurred. Please try again.');
      setStep('credentials');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Creating your account...</p>
        </div>
      </div>
    );
  }

  if (step === 'privacy') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <PrivacySetup
          onComplete={handlePrivacyComplete}
          onSkip={handlePrivacySkip}
          showSkipOption={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join Eventara to discover and manage events
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleCredentialsSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={credentials.password_confirmation}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password_confirmation: e.target.value }))}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Continue to Privacy Settings
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Next: Set your privacy preferences</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}