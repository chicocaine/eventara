import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { ResetPasswordRequest, PasswordResetResponse } from '../types/auth.js';

interface FormData {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
}

export default function ResetPasswordForm() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData>({
    email: location.state?.email || '',
    code: '',
    password: '',
    password_confirmation: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    location.state?.message ? { type: 'success', text: location.state.message } : null
  );
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Auto-focus on code input when component mounts
  useEffect(() => {
    const codeInput = document.getElementById('code-input');
    codeInput?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setMessage(null);
    setIsLoading(true);

    // Basic client-side validation
    if (formData.password !== formData.password_confirmation) {
      setErrors({ password_confirmation: ['Passwords do not match'] });
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setErrors({ password: ['Password must be at least 8 characters long'] });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post<PasswordResetResponse>('/api/password-reset/reset-password', {
        email: formData.email,
        code: formData.code,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: response.data.message 
        });
        
        // Redirect to login after successful reset
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Password reset successfully! Please sign in with your new password.' 
            } 
          });
        }, 2000);
      } else {
        setMessage({ type: 'error', text: response.data.message });
        if (response.data.errors) {
          setErrors(response.data.errors);
        }
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        setMessage({ type: 'error', text: errorData.message || 'An error occurred' });
        if (errorData.errors) {
          setErrors(errorData.errors);
        }
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Network error occurred. Please try again.' 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'code' ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: [] }));
    }
    if (message) {
      setMessage(null);
    }
  };

  const resendCode = async () => {
    if (!formData.email) return;
    
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await axios.post<PasswordResetResponse>('/api/password-reset/send-code', {
        email: formData.email,
      });

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: 'New reset code sent to your email!' 
        });
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to resend code. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the code sent to your email and your new password
          </p>
        </div>

        {message && (
          <div className={`border px-4 py-3 rounded ${
            message.type === 'success' 
              ? 'bg-green-100 border-green-400 text-green-700' 
              : 'bg-red-100 border-red-400 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {errors.general && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <ul>
              {errors.general.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Email address"
                value={formData.email}
                onChange={handleInputChange('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.join(', ')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="code-input" className="sr-only">
                Reset code
              </label>
              <input
                id="code-input"
                name="code"
                type="text"
                required
                maxLength={6}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.code ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm text-center font-mono text-lg tracking-wider`}
                placeholder="Reset Code (6 characters)"
                value={formData.code}
                onChange={handleInputChange('code')}
                disabled={isLoading}
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.code.join(', ')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="New password (minimum 8 characters)"
                value={formData.password}
                onChange={handleInputChange('password')}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.join(', ')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password_confirmation" className="sr-only">
                Confirm new password
              </label>
              <input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                autoComplete="new-password"
                required
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.password_confirmation ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Confirm new password"
                value={formData.password_confirmation}
                onChange={handleInputChange('password_confirmation')}
                disabled={isLoading}
              />
              {errors.password_confirmation && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password_confirmation.join(', ')}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading 
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting password...
                </>
              ) : (
                'Reset password'
              )}
            </button>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={resendCode}
              disabled={isLoading || !formData.email}
              className="text-sm text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Didn't receive the code? Resend it
            </button>
            
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link 
                to="/login" 
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}