import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface ReactivationPageProps {}

interface FormData {
  email: string;
  code: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  expires_at?: string;
  remaining_attempts?: number;
  user?: any;
  redirect_url?: string;
  errors?: Record<string, string[]>;
}

export default function ReactivationPage({}: ReactivationPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get email and message from either location state or URL parameters
  const urlParams = new URLSearchParams(location.search);
  const emailFromUrl = urlParams.get('email');
  const messageFromUrl = urlParams.get('message');
  
  const [formData, setFormData] = useState<FormData>({
    email: location.state?.email || emailFromUrl || '',
    code: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(() => {
    // Prioritize location state, then URL parameters
    const stateMessage = location.state?.message;
    const urlMessage = messageFromUrl;
    
    if (stateMessage) {
      return { type: 'error', text: stateMessage };
    } else if (urlMessage) {
      return { type: 'error', text: urlMessage };
    }
    return null;
  });
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number>(5);

  // Auto-focus on code input when code is sent
  useEffect(() => {
    if (isCodeSent) {
      const codeInput = document.getElementById('code-input');
      codeInput?.focus();
    }
  }, [isCodeSent]);

  // Clean up URL parameters after they're processed to prevent them from persisting in browser history
  useEffect(() => {
    if (emailFromUrl || messageFromUrl) {
      // Replace the current URL without the parameters, but keep the message in state
      const newUrl = `${location.pathname}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [emailFromUrl, messageFromUrl, location.pathname]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase().replace(/[^A-Z0-9]/g, '') : value,
    }));
    
    // Clear messages when user starts typing
    if (message) {
      setMessage(null);
    }
  };

  const sendReactivationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      setMessage({ type: 'error', text: 'Please enter your email address.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await axios.post<ApiResponse>('/api/reactivation/send-code', {
        email: formData.email,
      });

      if (response.data.success) {
        setIsCodeSent(true);
        setExpiresAt(response.data.expires_at || null);
        setRemainingAttempts(response.data.remaining_attempts || 0);
        setMessage({ 
          type: 'success', 
          text: response.data.message || 'Reactivation code sent to your email!' 
        });
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send reactivation code. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyReactivationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.code) {
      setMessage({ type: 'error', text: 'Please enter both email and reactivation code.' });
      return;
    }

    if (formData.code.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter the complete 6-digit code.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await axios.post<ApiResponse>('/api/reactivation/verify-code', {
        email: formData.email,
        code: formData.code,
      });

      if (response.data.success) {
        setIsSuccess(true);
        setMessage({ 
          type: 'success', 
          text: response.data.message || 'Account reactivated successfully!' 
        });
        
        // Don't auto-redirect anymore - let user click the button
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Invalid reactivation code. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login', { 
      state: { 
        message: 'Account reactivated successfully! Please sign in to continue.' 
      } 
    });
  };

  const formatExpirationTime = (expiresAt: string | null): string => {
    if (!expiresAt) return '';
    
    try {
      const expireDate = new Date(expiresAt);
      const now = new Date();
      const diffMinutes = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60));
      
      if (diffMinutes <= 0) {
        return 'Expired';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
      } else {
        return expireDate.toLocaleString();
      }
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reactivate Your Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {!isCodeSent 
              ? 'Your account is currently inactive. Enter your email address to receive a reactivation code.'
              : 'Check your email for the 6-digit reactivation code.'
            }
          </p>
        </div>

        {message && (
          <div className={`rounded-md p-4 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        )}

        {isSuccess ? (
          <div className="text-center space-y-6">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Account Reactivated!</h3>
              <p className="text-sm text-gray-600">
                Your account has been successfully reactivated. You can now sign in to access your dashboard.
              </p>
            </div>

            <button
              onClick={handleBackToLogin}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
        <form className="mt-8 space-y-6" onSubmit={isCodeSent ? verifyReactivationCode : sendReactivationCode}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isCodeSent}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  isCodeSent ? 'border-gray-200 bg-gray-50' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            {isCodeSent && (
              <div>
                <label htmlFor="code-input" className="block text-sm font-medium text-gray-700">
                  Reactivation Code
                </label>
                <input
                  id="code-input"
                  name="code"
                  type="text"
                  maxLength={6}
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm font-mono text-center text-lg tracking-widest"
                  placeholder="XXXXXX"
                  value={formData.code}
                  onChange={handleInputChange}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Enter the 6-digit code sent to your email address.
                </p>
                {expiresAt && (
                  <p className="mt-1 text-sm text-gray-500">
                    Code expires in: <span className="font-medium">{formatExpirationTime(expiresAt)}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : null}
              {isLoading 
                ? (isCodeSent ? 'Verifying...' : 'Sending Code...') 
                : (isCodeSent ? 'Reactivate Account' : 'Send Reactivation Code')
              }
            </button>
          </div>

          {isCodeSent && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsCodeSent(false);
                  setFormData(prev => ({ ...prev, code: '' }));
                  setMessage(null);
                }}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Use a different email address
              </button>
            </div>
          )}

          {remainingAttempts > 0 && remainingAttempts < 5 && (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining today
              </p>
            </div>
          )}
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Back to Login
            </button>
          </p>
        </div>
        </>
        )}
      </div>
    </div>
  );
}