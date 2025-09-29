import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import type { LoginCredentials } from '../types/auth.js';

export default function LoginForm() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
    remember: false,
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setMessage('');

    const response = await login(credentials);
    
    if (response.success) {
      // Redirect to dashboard or intended page
      if (response.redirect_url) {
        window.location.href = response.redirect_url;
      } else {
        navigate('/dashboard');
      }
    } else {

      // Check if account needs reactivation
      if (response.needs_reactivation) {
        navigate('/reactivate', { 
          state: { 
            email: credentials.email, 
            message: response.message 
          } 
        });
        return;
      }
      setMessage(response.message);
      if (response.errors) {
        setErrors(response.errors);
      }
    }
  };

  const handleInputChange = (field: keyof LoginCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'remember' ? e.target.checked : e.target.value;
    setCredentials(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: [] }));
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFAED]">
      <div className="flex min-h-screen flex-col lg:flex-row ml-20">
        {/* Left Column - Login Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-lg">
            <div className="bg-[#E6E2E7] rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10">
              <div className="max-w-md mx-auto space-y-6">
                <div>
                  <h3 className="font-poppins text-[25px] font-light text-black">Welcome !</h3>
                  <h2 className="pt-8 text-2xl sm:text-3xl font-poppins text-black mb-14">
                    Sign in to your account
                  </h2>
                </div>

                {message && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {message}
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

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-10">
                    <div>
                      <p className='font-poppins text-[16px] text-black my-2'>Username</p>
                      <label htmlFor="email" className="sr-only">
                        Email address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className={`appearance-none relative block w-full px-4 py-3 border ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base`}
                        placeholder="Email address"
                        value={credentials.email}
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
                      <p className='font-poppins text-[16px] text-black my-2'>Password</p>
                      <label htmlFor="password" className="sr-only">
                        Password
                      </label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className={`appearance-none relative block w-full px-4 py-3 border ${
                          errors.password ? 'border-red-300' : 'border-gray-300'
                        } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base`}
                        placeholder="Password"
                        value={credentials.password}
                        onChange={handleInputChange('password')}
                        disabled={isLoading}
                      />
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.password.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember"
                        name="remember"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={credentials.remember}
                        onChange={handleInputChange('remember')}
                        disabled={isLoading}
                      />
                      <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
                        Remember me
                      </label>
                    </div>
                    <div>
                      <Link to="/forgot-password" className='ml-2 block text-sm text-gray-900'>
                        Forgot Password?
                      </Link>
                    </div>
                  </div>

                  <div className='pb-10'>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white transition-colors ${
                      isLoading 
                        ? 'bg-[#6D52DC] opacity-70 cursor-not-allowed' 
                        : 'bg-[#6D52DC] hover:bg-[#5a41b8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6D52DC]'
                      }`}
                    >
                      {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </>
                      ) : (
                      'Login'
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Don't have an account?{' '}
                      <Link 
                        to="/register" 
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Register
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Image/Branding */}
        <div className="hidden lg:flex lg:flex-1 bg-[#FFFAED] items-center justify-center p-4 lg:p-6 xl:p-8 2xl:p-12 mr-20">
          <div className="flex flex-col items-center justify-center h-full max-w-2xl w-full">
            <div className="flex-1 flex items-center justify-center w-full">
              <div className="relative w-full max-w-lg lg:max-w-xl xl:max-w-2xl">
                {/* Logo container with aspect ratio preservation */}
                <div className="w-full" style={{ aspectRatio: '607/600' }}>
                  <img 
                    src="/images/users/DDC_Logo_Dark.png" 
                    alt="DDC Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}