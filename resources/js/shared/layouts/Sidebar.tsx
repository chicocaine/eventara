import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../modules/users/hooks/useAuth.js';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  // Permission-based navigation configuration
  const navigationConfig = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      permissions: ['view_profile'], // Basic permission that all users should have
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
        </svg>
      ),
    },
    {
      name: 'Events',
      href: '/events',
      permissions: ['view_events'],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: 'Venue Hub',
      href: '/venues',
      permissions: ['view_venues'],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      name: 'Volunteer Portal',
      href: '/volunteers',
      permissions: ['apply_volunteer', 'is_volunteer'], // Users can apply OR are already volunteers
      requiresAll: false, // User needs either permission to access
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
    },
  ];

  // Admin-only navigation items
  const adminNavigationConfig = [
    {
      name: 'Admin Panel',
      href: '/admin',
      permissions: ['admin_access'],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      name: 'Event Builder',
      href: '/admin/event-builder',
      permissions: ['admin_access', 'create_events'],
      requiresAll: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9" />
        </svg>
      ),
    },
    {
      name: 'Venue Management',
      href: '/admin/venue-management',
      permissions: ['admin_access', 'create_venues'],
      requiresAll: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
    {
      name: 'Volunteer Management',
      href: '/admin/volunteer-management',
      permissions: ['admin_access', 'manage_volunteers'],
      requiresAll: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: 'User Management',
      href: '/admin/users',
      permissions: ['admin_access', 'manage_users'],
      requiresAll: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      permissions: ['admin_access'], // Using admin_access as a general analytics permission
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      name: 'System Logs',
      href: '/admin/logs',
      permissions: ['admin_access', 'view_logs'],
      requiresAll: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  // Utility function to check if user has permission to access a navigation item
  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permission);
  };

  // Utility function to check if user can access a navigation item
  const canAccessNavItem = (item: { permissions: string[]; requiresAll?: boolean }): boolean => {
    if (!user?.permissions || !item.permissions.length) return false;
    
    const { permissions, requiresAll = false } = item;
    
    if (requiresAll) {
      // User must have ALL specified permissions
      return permissions.every(permission => hasPermission(permission));
    } else {
      // User needs at least ONE of the specified permissions
      return permissions.some(permission => hasPermission(permission));
    }
  };

  // Filter navigation items based on user permissions
  const navigation = navigationConfig.filter(item => canAccessNavItem(item));
  const adminNavigation = adminNavigationConfig.filter(item => canAccessNavItem(item));

  // Check if user has any admin permissions to show the admin section
  const hasAdminAccess = adminNavigation.length > 0;

  const isActiveLink = (href: string) => {
    return location.pathname === href;
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (user?.display_name) {
      return user.display_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="flex flex-col h-screen w-64 bg-white shadow-lg">
      {/* Logo Section */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Eventara</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {/* Regular Navigation Items */}
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
              isActiveLink(item.href)
                ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-500'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span
              className={`mr-3 flex-shrink-0 ${
                isActiveLink(item.href) ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
              }`}
            >
              {item.icon}
            </span>
            {item.name}
          </Link>
        ))}

        {/* Admin Section Separator */}
        {hasAdminAccess && (
          <>
            <div className="pt-4 pb-2">
              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
            </div>

            {/* Admin Navigation Items */}
            {adminNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActiveLink(item.href)
                    ? 'bg-red-100 text-red-700 border-r-2 border-red-500'
                    : 'text-gray-600 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                <span
                  className={`mr-3 flex-shrink-0 ${
                    isActiveLink(item.href) ? 'text-red-500' : 'text-gray-400 group-hover:text-red-500'
                  }`}
                >
                  {item.icon}
                </span>
                {item.name}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-200 p-4">
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center w-full px-3 py-2 text-sm text-left text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
          >
            {/* User Avatar */}
            <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3">
              {getUserInitials()}
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.display_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
            
            {/* Dropdown Arrow */}
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isUserMenuOpen ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* User Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </button>
                
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/profile?tab=settings');
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
                
                <div className="border-t border-gray-100 my-1"></div>
                
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}