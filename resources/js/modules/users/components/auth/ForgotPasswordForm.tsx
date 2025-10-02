import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { ForgotPasswordRequest, PasswordResetResponse } from '../../types/auth.js';

export default function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isCodeSent, setIsCodeSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await axios.post<PasswordResetResponse>('/api/password-reset/send-code', {
        email,
      });

      if (response.data.success) {
        setIsCodeSent(true);
        setMessage({ 
          type: 'success', 
          text: response.data.message 
        });
        
        // Navigate to reset password form with email
        setTimeout(() => {
          navigate('/reset-password', { 
            state: { 
              email, 
              message: response.data.message 
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
      console.error('Forgot password error:', error);
      
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    
    // Clear errors when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: [] }));
    }
    if (message) {
      setMessage(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Forgot your password?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a code to reset your password
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
              value={email}
              onChange={handleInputChange}
              disabled={isLoading || isCodeSent}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.join(', ')}
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || isCodeSent}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading || isCodeSent
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
                  Sending code...
                </>
              ) : isCodeSent ? (
                'Code sent! Redirecting...'
              ) : (
                'Send reset code'
              )}
            </button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link 
                to="/login" 
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign in
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}