import React from 'react';
import { Link } from 'react-router-dom';

export default function LockoutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-lg w-full bg-white shadow rounded-lg p-8 text-center">
        <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-3l-6.93-12a2 2 0 00-3.48 0l-6.93 12a2 2 0 001.74 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Account Suspended</h1>
        <p className="text-gray-600 mb-6">
          Your account is currently suspended. You can't access this application at the moment.
          If you believe this is a mistake or need assistance, please contact support.
        </p>
        <div className="space-x-3">
          <a href="mailto:support@eventara.example" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Contact Support</a>
          <Link to="/login" className="inline-flex items-center px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
