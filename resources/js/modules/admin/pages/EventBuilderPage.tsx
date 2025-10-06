import React from 'react';
import AdminLayout from '../../../shared/layouts/AdminLayout.js';
import ProtectedAdminRoute from '../../../shared/components/ProtectedAdminRoute.js';

export default function EventBuilderPage() {
  return (
    <ProtectedAdminRoute requiredPermissions={['admin_access', 'create_events']} requireAll={true}>
      <AdminLayout 
        title="Event Builder" 
        subtitle="Create and manage events with our visual builder"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Event Builder Header */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Event Builder</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Create comprehensive events with sessions, venues, and volunteer management
                  </p>
                </div>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Event
                </button>
              </div>
            </div>
          </div>

          {/* Event Builder Steps */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Event Creation Process</h4>
              <div className="flex items-center space-x-8">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">1</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Basic Information</p>
                    <p className="text-xs text-gray-500">Name, description, dates</p>
                  </div>
                </div>
                
                <div className="flex-1 border-t border-gray-300"></div>
                
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-sm font-medium">2</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Sessions & Schedule</p>
                    <p className="text-xs text-gray-500">Add event sessions</p>
                  </div>
                </div>
                
                <div className="flex-1 border-t border-gray-300"></div>
                
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-sm font-medium">3</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Venue Assignment</p>
                    <p className="text-xs text-gray-500">Assign venues to sessions</p>
                  </div>
                </div>
                
                <div className="flex-1 border-t border-gray-300"></div>
                
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-sm font-medium">4</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Publish</p>
                    <p className="text-xs text-gray-500">Review and publish event</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Events */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Recent Events</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Summer Music Festival</p>
                      <p className="text-xs text-gray-500">Created 2 days ago • 5 sessions</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Published
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Tech Conference 2025</p>
                      <p className="text-xs text-gray-500">Created 1 week ago • 12 sessions</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Draft
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Community Workshop</p>
                      <p className="text-xs text-gray-500">Created 2 weeks ago • 3 sessions</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Published
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Event Templates</h4>
                <div className="space-y-3">
                  <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <p className="text-sm font-medium text-gray-900">Conference Template</p>
                    <p className="text-xs text-gray-500">Multi-day event with sessions and workshops</p>
                  </div>
                  <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <p className="text-sm font-medium text-gray-900">Workshop Template</p>
                    <p className="text-xs text-gray-500">Single-day educational event</p>
                  </div>
                  <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <p className="text-sm font-medium text-gray-900">Festival Template</p>
                    <p className="text-xs text-gray-500">Multi-venue entertainment event</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Temporary Notice */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Event Builder - Coming Soon
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>The visual event builder is currently under development. This page shows the planned interface and workflow.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}