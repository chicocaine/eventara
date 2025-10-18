import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../modules/users/hooks/useAuth.js';

interface GuestOnlyRouteProps {
  children: React.ReactNode;
}

export default function GuestOnlyRoute({ children }: GuestOnlyRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, not suspended, and active, redirect to dashboard
  if (isAuthenticated && user && user.active !== false && user.suspended !== true) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
