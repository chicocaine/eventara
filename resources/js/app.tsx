import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  AuthProvider, 
  LoginPage, 
  RegisterPage, 
  DashboardPage,
  ReactivationPage,
  ProtectedRoute 
} from './modules/users/index.js';
import EventsPage from './modules/events/pages/EventsPage.js';
import VenuesPage from './modules/venues/pages/VenuesPage.js';
import VolunteersPage from './modules/volunteers/pages/VolunteersPage.js';
import CertifikaPage from './modules/users/pages/CertifikaPage.js';
import ProfilePage from './modules/users/pages/ProfilePage.js';
import ForgotPasswordForm from './modules/users/components/auth/ForgotPasswordForm.js';
import ResetPasswordForm from './modules/users/components/auth/ResetPasswordForm.js';
import ProfileSetupForm from './modules/users/components/profile/ProfileSetupForm.js';

// Admin pages
import AdminPanelPage from './modules/admin/pages/AdminPanelPage.js';
import EventBuilderPage from './modules/admin/pages/EventBuilderPage.js';
import VenueManagementPage from './modules/admin/pages/VenueManagementPage.js';
import VolunteerManagementPage from './modules/admin/pages/VolunteerManagementPage.js';
import UserManagementPage from './modules/admin/pages/UserManagementPage.js';
import AnalyticsPage from './modules/admin/pages/AnalyticsPage.js';
import SystemLogsPage from './modules/admin/pages/SystemLogsPage.js';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordForm />} />
                    <Route path="/reset-password" element={<ResetPasswordForm />} />
                    <Route path="/reactivate" element={<ReactivationPage />} />
                    
                    {/* Semi-protected routes (user must be authenticated) */}
                    <Route 
                        path="/profile-setup" 
                        element={
                            <ProtectedRoute redirectTo="/login">
                                <ProfileSetupForm />
                            </ProtectedRoute>
                        } 
                    />
                    
                    {/* Protected routes */}
                    <Route 
                        path="/dashboard" 
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/events" 
                        element={
                            <ProtectedRoute>
                                <EventsPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/venues" 
                        element={
                            <ProtectedRoute>
                                <VenuesPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/volunteers" 
                        element={
                            <ProtectedRoute>
                                <VolunteersPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/certifika" 
                        element={
                            <ProtectedRoute>
                                <CertifikaPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/profile" 
                        element={
                            <ProtectedRoute>
                                <ProfilePage />
                            </ProtectedRoute>
                        } 
                    />
                    
                    {/* Admin routes */}
                    <Route 
                        path="/admin" 
                        element={
                            <ProtectedRoute>
                                <AdminPanelPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/event-builder" 
                        element={
                            <ProtectedRoute>
                                <EventBuilderPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/venue-management" 
                        element={
                            <ProtectedRoute>
                                <VenueManagementPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/volunteer-management" 
                        element={
                            <ProtectedRoute>
                                <VolunteerManagementPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/users" 
                        element={
                            <ProtectedRoute>
                                <UserManagementPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/analytics" 
                        element={
                            <ProtectedRoute>
                                <AnalyticsPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/logs" 
                        element={
                            <ProtectedRoute>
                                <SystemLogsPage />
                            </ProtectedRoute>
                        } 
                    />
                    
                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    
                    {/* Catch all - redirect to dashboard */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
