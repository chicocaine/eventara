import { useAuth } from '../../modules/users/hooks/useAuth.js';

export function usePermissions() {
  const { user } = useAuth();

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permission);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user?.permissions || !permissions.length) return false;
    return permissions.some(permission => hasPermission(permission));
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user?.permissions || !permissions.length) return false;
    return permissions.every(permission => hasPermission(permission));
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roles: string[]): boolean => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  };

  /**
   * Check if user is an admin
   */
  const isAdmin = (): boolean => {
    return hasRole('admin') || hasPermission('admin_access');
  };

  /**
   * Check if user is a volunteer
   */
  const isVolunteer = (): boolean => {
    return hasRole('volunteer') || hasPermission('is_volunteer');
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin,
    isVolunteer,
    permissions: user?.permissions || [],
    role: user?.role,
  };
}