import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../modules/users/hooks/useAuth.js';
import { usePermissions } from '../hooks/usePermissions.js';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  requireAll?: boolean; // If true, user must have ALL permissions/roles, otherwise ANY
  fallbackPath?: string;
}

export default function ProtectedAdminRoute({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  requireAll = false,
  fallbackPath = '/dashboard'
}: ProtectedAdminRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasAnyPermission, hasAllPermissions, hasAnyRole, hasRole } = usePermissions();

  // Show loading state while checking authentication
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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check permissions
  const hasRequiredPermissions = requiredPermissions.length === 0 || 
    (requireAll ? hasAllPermissions(requiredPermissions) : hasAnyPermission(requiredPermissions));

  // Check roles
  const hasRequiredRoles = requiredRoles.length === 0 || 
    (requireAll ? requiredRoles.every(role => hasRole(role)) : hasAnyRole(requiredRoles));

  // Allow access if user has required permissions AND roles
  const hasAccess = hasRequiredPermissions && hasRequiredRoles;

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}