import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../../shared/layouts/AdminLayout.js';
import ProtectedAdminRoute from '../../../shared/components/ProtectedAdminRoute.js';
import userManagementService, { 
  type User, 
  type UserStats, 
  type UserListFilters 
} from '../services/userManagementService.js';

export default function UserManagementPage() {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<number, string>>({});
  
  // User detail modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  
  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<{
    type: 'suspend' | 'unsuspend' | 'activate' | 'deactivate' | 'role_change';
    userId: number;
    userEmail: string;
    newRole?: string;
  } | null>(null);
  const [confirmationInput, setConfirmationInput] = useState('');
  
  // Filters and pagination state
  const [filters, setFilters] = useState<UserListFilters>({
    per_page: 15,
    page: 1,
    sort_by: 'created_at',
    sort_direction: 'desc'
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0
  });

  // Search state with debouncing
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Update filters when debounced search changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  // Load users data
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userManagementService.getUsers(filters);
      setUsers(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const response = await userManagementService.getUserStats();
      setStats(response.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // User action handlers
  const handleUserAction = async (userId: number, action: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Show confirmation dialog for destructive actions
    setConfirmationAction({
      type: action as 'suspend' | 'unsuspend' | 'activate' | 'deactivate',
      userId,
      userEmail: user.email
    });
    setShowConfirmation(true);
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    const user = users.find(u => u.id === userId);
    if (!user || user.role === newRole) return;

    // Show confirmation dialog for role changes
    setConfirmationAction({
      type: 'role_change',
      userId,
      userEmail: user.email,
      newRole
    });
    setShowConfirmation(true);
  };

  // Execute confirmed action
  const executeConfirmedAction = async () => {
    if (!confirmationAction) return;

    try {
      setActionLoading(prev => ({ ...prev, [confirmationAction.userId]: confirmationAction.type }));
      setError(null);

      let response;
      switch (confirmationAction.type) {
        case 'suspend':
          response = await userManagementService.suspendUser(confirmationAction.userId);
          break;
        case 'unsuspend':
          response = await userManagementService.unsuspendUser(confirmationAction.userId);
          break;
        case 'deactivate':
          response = await userManagementService.deactivateUser(confirmationAction.userId);
          break;
        case 'activate':
          response = await userManagementService.activateUser(confirmationAction.userId);
          break;
        case 'role_change':
          response = await userManagementService.updateUserRole(confirmationAction.userId, confirmationAction.newRole!);
          break;
        default:
          throw new Error('Invalid action');
      }

      if (response.success) {
        // Reload data to reflect changes
        await Promise.all([loadUsers(), loadStats()]);
        // Close confirmation modal
        setShowConfirmation(false);
        setConfirmationAction(null);
        setConfirmationInput('');
      } else {
        setError(response.message || 'Action failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[confirmationAction.userId];
        return newState;
      });
    }
  };

  // Get confirmation text that user needs to type
  const getConfirmationText = (): string => {
    if (!confirmationAction) return '';
    
    const { type, userEmail, newRole } = confirmationAction;
    
    switch (type) {
      case 'suspend':
        return `suspend-${userEmail}`;
      case 'unsuspend':
        return `unsuspend-${userEmail}`;
      case 'deactivate':
        return `deactivate-${userEmail}`;
      case 'activate':
        return `activate-${userEmail}`;
      case 'role_change':
        return `role-${newRole}-${userEmail}`;
      default:
        return '';
    }
  };

  // Check if confirmation input matches required text
  const isConfirmationValid = (): boolean => {
    return confirmationInput === getConfirmationText();
  };

  // Close confirmation modal
  const closeConfirmation = () => {
    setShowConfirmation(false);
    setConfirmationAction(null);
    setConfirmationInput('');
  };

  // Filter handlers
  const handleFilterChange = (key: keyof UserListFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSort = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sort_by: sortBy,
      sort_direction: prev.sort_by === sortBy && prev.sort_direction === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // View user handler
  const handleViewUser = async (userId: number) => {
    try {
      const response = await userManagementService.getUser(userId);
      setSelectedUser(response.user);
      setShowUserDetail(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user details');
    }
  };

  const handleCloseUserDetail = () => {
    setShowUserDetail(false);
    setSelectedUser(null);
  };

  // Helper functions
  const getStatusBadge = (user: User) => {
    if (user.suspended) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Suspended
        </span>
      );
    }
    if (!user.active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Inactive
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      volunteer: 'bg-blue-100 text-blue-800',
      user: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[role as keyof typeof colors] || colors.user}`}>
        {role?.charAt(0).toUpperCase() + role?.slice(1) || 'User'}
      </span>
    );
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never';
    
    // Parse the date string - now includes timezone info (e.g., "2025-10-06T12:11:38.000000+08:00")
    const date = new Date(lastLogin);
    const now = new Date();
    
    // Calculate the difference in milliseconds
    const diffTime = now.getTime() - date.getTime();
    
    // Convert to different time units
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // More accurate relative time formatting
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) === 1 ? '' : 's'} ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} month${Math.ceil(diffDays / 30) === 1 ? '' : 's'} ago`;
    
    // For very old dates, show the actual date in local format
    return date.toLocaleDateString();
  };

  const getUserInitials = (user: User): string => {
    // First, try first_name + last_name
    if (user.first_name && user.last_name && 
        user.first_name.length > 0 && user.last_name.length > 0) {
      return (user.first_name.charAt(0) + user.last_name.charAt(0)).toUpperCase();
    }
    
    // Then try display_name
    if (user.display_name && user.display_name.length > 0) {
      const names = user.display_name.split(' ').filter(name => name.length > 0);
      if (names.length >= 2) {
        const first = names[0];
        const second = names[1];
        if (first && second && first.length > 0 && second.length > 0) {
          return (first.charAt(0) + second.charAt(0)).toUpperCase();
        }
      }
      return user.display_name.slice(0, 2).toUpperCase();
    }
    
    // Fallback to email
    return user.email.slice(0, 2).toUpperCase();
  };

  // Smart abbreviation function for demographics
  const abbreviateDemographic = (field: string, value: string | undefined): { display: string; full: string } => {
    if (!value) return { display: 'N/A', full: 'Not provided' };
    
    // Common abbreviations for demographic values
    const abbreviations: { [key: string]: string } = {
      // Gender
      'prefer-not-to-say': 'PNTS',
      'non-binary': 'NB',
      'male': 'M',
      'female': 'F',
      
      // Age groups
      'under-18': '<18',
      '18-24': '18-24',
      '25-34': '25-34', 
      '35-44': '35-44',
      '45-54': '45-54',
      '55-64': '55-64',
      'over-65': '65+',
      
      // Education (common long ones)
      'high-school': 'HS',
      'bachelors-degree': 'Bach',
      'masters-degree': 'Mast', 
      'doctoral-degree': 'PhD',
      'some-college': 'Some Col',
      'vocational-training': 'Vocational',
      
      // Common occupations that might be long
      'information-technology': 'IT',
      'healthcare-professional': 'Healthcare',
      'education-teaching': 'Education',
      'business-finance': 'Business',
      'arts-entertainment': 'Arts/Ent',
      'government-public-service': 'Gov/Public',
    };
    
    const lowerValue = value.toLowerCase();
    if (abbreviations[lowerValue]) {
      return { display: abbreviations[lowerValue], full: value };
    }
    
    // If no specific abbreviation, truncate long values
    if (value.length > 8) {
      return { display: value.substring(0, 6) + '..', full: value };
    }
    
    return { display: value, full: value };
  };

  // Additional filter helpers
  const handleClearFilter = (key: keyof UserListFilters) => {
    setFilters(prev => ({ ...prev, [key]: '', page: 1 }));
  };

  const handleClearAllFilters = () => {
    setFilters({
      search: '',
      role: '',
      status: '',
      age_group: '',
      gender: '',
      occupation: '',
      education_level: '',
      sort_by: 'created_at',
      sort_direction: 'desc',
      per_page: 20,
      page: 1,
    });
    setSearchTerm('');
    setDebouncedSearch('');
  };

  const getActiveFiltersCount = (): number => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'sort_by' || key === 'sort_direction' || key === 'per_page' || key === 'page') return false;
      return value !== '';
    }).length;
  };
  return (
    <ProtectedAdminRoute requiredPermissions={['admin_access', 'manage_users']} requireAll={true}>
      <AdminLayout 
        title="User Management" 
        subtitle="Manage user accounts, roles, and permissions"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError(null)}
                    className="inline-flex text-red-400 hover:text-red-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Management Actions */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">User Management</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Monitor user activity, manage roles, and handle account issues
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Export Users
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.total_users || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.active_users || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Suspended</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.suspended_users || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">New This Week</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.new_this_week || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex-1">
                  <label htmlFor="search" className="sr-only">Search users</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      id="search"
                      name="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Search users by name or email..."
                      type="search"
                    />
                  </div>
                </div>

                {/* Filter Row 1: Basic Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <select 
                    value={filters.role || ''}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="user">User</option>
                  </select>

                  <select 
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <select 
                    value={filters.age_group || ''}
                    onChange={(e) => handleFilterChange('age_group', e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Ages</option>
                    <option value="17 below">17 & Below</option>
                    <option value="18-24">18-24</option>
                    <option value="25-34">25-34</option>
                    <option value="35-44">35-44</option>
                    <option value="45-54">45-54</option>
                    <option value="55-64">55-64</option>
                    <option value="65+">65+</option>
                  </select>

                  <select 
                    value={filters.gender || ''}
                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Filter Row 2: Additional Demographics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <select 
                    value={filters.occupation || ''}
                    onChange={(e) => handleFilterChange('occupation', e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Occupations</option>
                    <option value="student">Student</option>
                    <option value="employed">Employed</option>
                    <option value="self-employed">Self-employed</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="retired">Retired</option>
                    <option value="homemaker">Homemaker</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="entrepreneur">Entrepreneur</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="other">Other</option>
                  </select>

                  <select 
                    value={filters.education_level || ''}
                    onChange={(e) => handleFilterChange('education_level', e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Education Levels</option>
                    <option value="elementary">Elementary</option>
                    <option value="high-school">High School</option>
                    <option value="some-college">Some College</option>
                    <option value="bachelors">Bachelor's</option>
                    <option value="masters">Master's</option>
                    <option value="doctorate">Doctorate</option>
                    <option value="professional">Professional</option>
                    <option value="trade-school">Trade School</option>
                    <option value="other">Other</option>
                  </select>

                  <select 
                    value={filters.per_page?.toString() || '15'}
                    onChange={(e) => handleFilterChange('per_page', e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="10">10 per page</option>
                    <option value="15">15 per page</option>
                    <option value="25">25 per page</option>
                    <option value="50">50 per page</option>
                  </select>
                </div>

                {/* Active Filters Display */}
                {(filters.search || filters.role || filters.status || filters.age_group || filters.gender || filters.occupation || filters.education_level) && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-500">Active filters:</span>
                    {filters.search && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Search: {filters.search}
                        <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-blue-600">×</button>
                      </span>
                    )}
                    {filters.role && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Role: {filters.role}
                        <button onClick={() => handleFilterChange('role', '')} className="ml-1 hover:text-purple-600">×</button>
                      </span>
                    )}
                    {filters.status && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Status: {filters.status}
                        <button onClick={() => handleFilterChange('status', '')} className="ml-1 hover:text-green-600">×</button>
                      </span>
                    )}
                    {filters.age_group && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Age: {filters.age_group}
                        <button onClick={() => handleFilterChange('age_group', '')} className="ml-1 hover:text-yellow-600">×</button>
                      </span>
                    )}
                    {filters.gender && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                        Gender: {filters.gender}
                        <button onClick={() => handleFilterChange('gender', '')} className="ml-1 hover:text-pink-600">×</button>
                      </span>
                    )}
                    {filters.occupation && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        Occupation: {filters.occupation}
                        <button onClick={() => handleFilterChange('occupation', '')} className="ml-1 hover:text-indigo-600">×</button>
                      </span>
                    )}
                    {filters.education_level && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Education: {filters.education_level}
                        <button onClick={() => handleFilterChange('education_level', '')} className="ml-1 hover:text-gray-600">×</button>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Users Table */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-900">
                  User Directory ({pagination.total} users)
                </h4>
                {loading && (
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                    </svg>
                    Loading...
                  </div>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        onClick={() => handleSort('display_name')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          User
                          {filters.sort_by === 'display_name' && (
                            <svg className={`ml-1 h-4 w-4 ${filters.sort_direction === 'asc' ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('role')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          Role
                          {filters.sort_by === 'role' && (
                            <svg className={`ml-1 h-4 w-4 ${filters.sort_direction === 'asc' ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Demographics
                      </th>
                      <th 
                        onClick={() => handleSort('last_login')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          Last Login
                          {filters.sort_by === 'last_login' && (
                            <svg className={`ml-1 h-4 w-4 ${filters.sort_direction === 'asc' ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <svg className="animate-spin h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                            </svg>
                            <span className="text-gray-500">Loading users...</span>
                          </div>
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            <span className="text-gray-500 text-lg">No users found</span>
                            <span className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                                  <span className="text-sm font-medium text-white">
                                    {getUserInitials(user)}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.display_name}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                                {user.auth_provider && (
                                  <div className="text-xs text-blue-600">
                                    via {user.auth_provider}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              disabled={actionLoading[user.id] === 'role_change'}
                              className="text-xs font-medium rounded-full border-0 bg-transparent focus:ring-0 focus:outline-none"
                            >
                              <option value="user">User</option>
                              <option value="volunteer">Volunteer</option>
                              <option value="admin">Admin</option>
                            </select>
                            {actionLoading[user.id] === 'role_change' && (
                              <svg className="animate-spin h-3 w-3 text-gray-400 ml-1 inline" fill="none" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                              </svg>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(user)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-600 space-y-1">
                              {user.age_group && (
                                <div className="group relative">
                                  <span className="cursor-help">
                                    Age: {abbreviateDemographic('age_group', user.age_group).display}
                                  </span>
                                  <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 whitespace-nowrap">
                                    {abbreviateDemographic('age_group', user.age_group).full}
                                  </div>
                                </div>
                              )}
                              {user.gender && (
                                <div className="group relative">
                                  <span className="cursor-help">
                                    Gender: {abbreviateDemographic('gender', user.gender).display}
                                  </span>
                                  <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 whitespace-nowrap">
                                    {abbreviateDemographic('gender', user.gender).full}
                                  </div>
                                </div>
                              )}
                              {user.occupation && (
                                <div className="group relative">
                                  <span className="cursor-help">
                                    Job: {abbreviateDemographic('occupation', user.occupation).display}
                                  </span>
                                  <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 whitespace-nowrap">
                                    {abbreviateDemographic('occupation', user.occupation).full}
                                  </div>
                                </div>
                              )}
                              {user.education_level && (
                                <div className="group relative">
                                  <span className="cursor-help">
                                    Edu: {abbreviateDemographic('education_level', user.education_level).display}
                                  </span>
                                  <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 whitespace-nowrap">
                                    {abbreviateDemographic('education_level', user.education_level).full}
                                  </div>
                                </div>
                              )}
                              {!user.age_group && !user.gender && !user.occupation && !user.education_level && (
                                <div className="text-gray-400">No data</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatLastLogin(user.last_login)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-1">
                              {user.suspended ? (
                                <button
                                  onClick={() => handleUserAction(user.id, 'unsuspend')}
                                  disabled={!!actionLoading[user.id]}
                                  className="group relative p-1 text-green-600 hover:text-green-900 disabled:opacity-50 rounded-md hover:bg-green-50"
                                  title="Unsuspend user"
                                >
                                  {actionLoading[user.id] === 'unsuspend' ? (
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                                    </svg>
                                  ) : (
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                    </svg>
                                  )}
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 whitespace-nowrap">
                                    Unsuspend
                                  </div>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction(user.id, 'suspend')}
                                  disabled={!!actionLoading[user.id]}
                                  className="group relative p-1 text-yellow-600 hover:text-yellow-900 disabled:opacity-50 rounded-md hover:bg-yellow-50"
                                  title="Suspend user"
                                >
                                  {actionLoading[user.id] === 'suspend' ? (
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                                    </svg>
                                  ) : (
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                    </svg>
                                  )}
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 whitespace-nowrap">
                                    Suspend
                                  </div>
                                </button>
                              )}

                              {user.active ? (
                                <button
                                  onClick={() => handleUserAction(user.id, 'deactivate')}
                                  disabled={!!actionLoading[user.id]}
                                  className="group relative p-1 text-red-600 hover:text-red-900 disabled:opacity-50 rounded-md hover:bg-red-50"
                                  title="Deactivate user"
                                >
                                  {actionLoading[user.id] === 'deactivate' ? (
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                                    </svg>
                                  ) : (
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 whitespace-nowrap">
                                    Deactivate
                                  </div>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction(user.id, 'activate')}
                                  disabled={!!actionLoading[user.id]}
                                  className="group relative p-1 text-green-600 hover:text-green-900 disabled:opacity-50 rounded-md hover:bg-green-50"
                                  title="Activate user"
                                >
                                  {actionLoading[user.id] === 'activate' ? (
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                                    </svg>
                                  ) : (
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 whitespace-nowrap">
                                    Activate
                                  </div>
                                </button>
                              )}

                              <button 
                                onClick={() => handleViewUser(user.id)}
                                className="group relative p-1 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50"
                                title="View user details"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 whitespace-nowrap">
                                  View Details
                                </div>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.total > 0 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(pagination.current_page - 1)}
                        disabled={pagination.current_page <= 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.current_page + 1)}
                        disabled={pagination.current_page >= pagination.last_page}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{pagination.from}</span> to{' '}
                          <span className="font-medium">{pagination.to}</span> of{' '}
                          <span className="font-medium">{pagination.total}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(pagination.current_page - 1)}
                            disabled={pagination.current_page <= 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          
                          {/* Page numbers */}
                          {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                            let pageNum;
                            if (pagination.last_page <= 5) {
                              pageNum = i + 1;
                            } else if (pagination.current_page <= 3) {
                              pageNum = i + 1;
                            } else if (pagination.current_page >= pagination.last_page - 2) {
                              pageNum = pagination.last_page - 4 + i;
                            } else {
                              pageNum = pagination.current_page - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  pageNum === pagination.current_page
                                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => handlePageChange(pagination.current_page + 1)}
                            disabled={pagination.current_page >= pagination.last_page}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Confirmation Modal */}
          {showConfirmation && confirmationAction && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 max-w-md shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center justify-center mx-auto w-12 h-12 rounded-full bg-red-100">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.5 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  
                  <div className="mt-5 text-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      Confirm {confirmationAction.type === 'role_change' ? 'Role Change' : confirmationAction.type}
                    </h3>
                    
                    <div className="mt-4 text-sm text-gray-600">
                      <p className="mb-4">
                        {confirmationAction.type === 'role_change' 
                          ? `Are you sure you want to change the role for ${confirmationAction.userEmail} to ${confirmationAction.newRole}?`
                          : `Are you sure you want to ${confirmationAction.type} the account for ${confirmationAction.userEmail}?`
                        }
                      </p>
                      
                      <p className="mb-4 font-medium">
                        This action cannot be undone easily. To confirm, type{' '}
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                          {getConfirmationText()}
                        </code>{' '}
                        below:
                      </p>
                      
                      <input
                        type="text"
                        value={confirmationInput}
                        onChange={(e) => setConfirmationInput(e.target.value)}
                        placeholder={`Type "${getConfirmationText()}" to confirm`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={closeConfirmation}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeConfirmedAction}
                      disabled={!isConfirmationValid() || !!actionLoading[confirmationAction.userId]}
                      className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        isConfirmationValid() && !actionLoading[confirmationAction.userId]
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {actionLoading[confirmationAction.userId] ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                          </svg>
                          Processing...
                        </div>
                      ) : (
                        `Confirm ${confirmationAction.type === 'role_change' ? 'Role Change' : confirmationAction.type}`
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Detail Modal */}
          {showUserDetail && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
              <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {getUserInitials(selectedUser)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedUser.display_name}
                      </h3>
                      <p className="text-sm text-gray-500">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseUserDetail}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="px-6 py-6">
                  {/* Status and Role Overview */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-500 mb-1">Account Status</div>
                        <div>{getStatusBadge(selectedUser)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-500 mb-1">Role</div>
                        <div>{getRoleBadge(selectedUser.role)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-500 mb-1">Auth Provider</div>
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {selectedUser.auth_provider || 'Email'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                      {/* Personal Information Card */}
                      <div className="bg-white border border-gray-200 rounded-lg p-5">
                        <div className="flex items-center mb-4">
                          <svg className="h-5 w-5 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <h5 className="text-lg font-semibold text-gray-900">Personal Information</h5>
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <dt className="text-sm font-medium text-gray-500">First Name</dt>
                              <dd className="mt-1 text-sm text-gray-900 font-medium">{selectedUser.first_name || 'Not provided'}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                              <dd className="mt-1 text-sm text-gray-900 font-medium">{selectedUser.last_name || 'Not provided'}</dd>
                            </div>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                            <dd className="mt-1 text-sm text-gray-900 font-medium flex items-center">
                              {selectedUser.email}
                              {selectedUser.email_verified_at && (
                                <svg className="ml-2 h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                            <dd className="mt-1 text-sm text-gray-900 font-medium">{selectedUser.phone || 'Not provided'}</dd>
                          </div>
                        </div>
                      </div>

                      {/* Demographics Card */}
                      <div className="bg-white border border-gray-200 rounded-lg p-5">
                        <div className="flex items-center mb-4">
                          <svg className="h-5 w-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <h5 className="text-lg font-semibold text-gray-900">Demographics</h5>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Age Group</dt>
                            <dd className="mt-1 text-sm text-gray-900 font-medium">{selectedUser.age_group || 'Not provided'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Gender</dt>
                            <dd className="mt-1 text-sm text-gray-900 font-medium">{selectedUser.gender || 'Not provided'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Occupation</dt>
                            <dd className="mt-1 text-sm text-gray-900 font-medium">{selectedUser.occupation || 'Not provided'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Education Level</dt>
                            <dd className="mt-1 text-sm text-gray-900 font-medium">{selectedUser.education_level || 'Not provided'}</dd>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* Account Information Card */}
                      <div className="bg-white border border-gray-200 rounded-lg p-5">
                        <div className="flex items-center mb-4">
                          <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <h5 className="text-lg font-semibold text-gray-900">Account Security</h5>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Email Verification</dt>
                            <dd className="mt-1 flex items-center">
                              {selectedUser.email_verified_at ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Not verified
                                </span>
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Authentication Method</dt>
                            <dd className="mt-1 text-sm text-gray-900 font-medium">
                              {selectedUser.auth_provider ? (
                                <span className="capitalize">{selectedUser.auth_provider} OAuth</span>
                              ) : (
                                'Email & Password'
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Account Access</dt>
                            <dd className="mt-1">
                              {selectedUser.active ? (
                                selectedUser.suspended ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Suspended
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Full Access
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Deactivated
                                </span>
                              )}
                            </dd>
                          </div>
                        </div>
                      </div>

                      {/* Activity Timeline Card */}
                      <div className="bg-white border border-gray-200 rounded-lg p-5">
                        <div className="flex items-center mb-4">
                          <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h5 className="text-lg font-semibold text-gray-900">Activity Timeline</h5>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-2 w-2 bg-green-400 rounded-full mt-2"></div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Last Login</p>
                              <p className="text-sm text-gray-500">{formatLastLogin(selectedUser.last_login)}</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-2 w-2 bg-blue-400 rounded-full mt-2"></div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Account Created</p>
                              <p className="text-sm text-gray-500">
                                {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                }) : 'Unknown'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-2 w-2 bg-purple-400 rounded-full mt-2"></div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Profile Updated</p>
                              <p className="text-sm text-gray-500">
                                {selectedUser.updated_at ? new Date(selectedUser.updated_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                }) : 'Unknown'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Profile Completion Card */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-5">
                        <div className="flex items-center mb-4">
                          <svg className="h-5 w-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <h5 className="text-lg font-semibold text-gray-900">Profile Completion</h5>
                        </div>
                        <div>
                          {(() => {
                            const fields = [
                              selectedUser.first_name,
                              selectedUser.last_name,
                              selectedUser.phone,
                              selectedUser.age_group,
                              selectedUser.gender,
                              selectedUser.occupation,
                              selectedUser.education_level
                            ];
                            const completed = fields.filter(field => field && field.trim() !== '').length;
                            const percentage = Math.round((completed / fields.length) * 100);
                            return (
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-gray-900">{percentage}% Complete</span>
                                  <span className="text-sm text-gray-500">{completed}/{fields.length} fields</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
                  <button
                    onClick={handleCloseUserDetail}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleCloseUserDetail();
                      // Could implement edit user functionality here
                    }}
                    className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-200"
                  >
                    Edit User
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Temporary Notice */}
          <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-indigo-800">
                  User Management Dashboard
                </h3>
                <div className="mt-2 text-sm text-indigo-700">
                  <p>This is a temporary user management interface. Full user account management, role assignment, and bulk operations are being implemented.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}