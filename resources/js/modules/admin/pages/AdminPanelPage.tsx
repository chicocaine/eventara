import React from 'react';
import AdminLayout from '../../../shared/layouts/AdminLayout.js';
import ProtectedAdminRoute from '../../../shared/components/ProtectedAdminRoute.js';
import { usePermissions } from '../../../shared/hooks/usePermissions.js';

export default function AdminPanelPage() {
  const { permissions, role } = usePermissions();

  return (
    <ProtectedAdminRoute requiredPermissions={['admin_access']}>
      <AdminLayout 
        title="Admin Panel" 
        subtitle="System administration and overview"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                Welcome to the Admin Panel
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Manage your Eventara platform from this central administration dashboard.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Your Role:</span>
                  <span className="ml-2 capitalize text-indigo-600">{role}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Permissions:</span>
                  <span className="ml-2 text-indigo-600">{permissions.length} granted</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                      <dd className="text-lg font-medium text-gray-900">1,247</dd>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Events</dt>
                      <dd className="text-lg font-medium text-gray-900">89</dd>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Registered Venues</dt>
                      <dd className="text-lg font-medium text-gray-900">234</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Volunteers</dt>
                      <dd className="text-lg font-medium text-gray-900">156</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent System Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-2 w-2 bg-green-400 rounded-full"></div>
                  <p className="text-sm text-gray-600">New user registration: john.doe@example.com</p>
                  <span className="text-xs text-gray-400">2 minutes ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-2 w-2 bg-blue-400 rounded-full"></div>
                  <p className="text-sm text-gray-600">Event "Summer Festival 2025" was created</p>
                  <span className="text-xs text-gray-400">15 minutes ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-2 w-2 bg-purple-400 rounded-full"></div>
                  <p className="text-sm text-gray-600">New venue "Downtown Convention Center" approved</p>
                  <span className="text-xs text-gray-400">1 hour ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-2 w-2 bg-orange-400 rounded-full"></div>
                  <p className="text-sm text-gray-600">Volunteer application submitted by Mary Johnson</p>
                  <span className="text-xs text-gray-400">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* Temporary Notice */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Temporary Admin Panel
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>This is a temporary admin panel page. Full functionality will be implemented based on requirements.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}