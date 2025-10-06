<?php

use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\ProfileSetupController;
use App\Http\Controllers\Auth\ReactivationController;
use App\Http\Controllers\Auth\GoogleAuth;
use App\Http\Controllers\CertifikaController;
use App\Http\Controllers\User\ProfileController;
use App\Http\Controllers\User\UserController;
use App\Http\Controllers\User\UserEventController;
use Illuminate\Support\Facades\Route;

// Authentication routes
Route::post('/auth/login', [AuthController::class, 'login'])->name('api.login');
Route::post('/auth/register', [AuthController::class, 'register'])->name('api.register');
Route::post('/auth/logout', [AuthController::class, 'logout'])->name('api.logout');
Route::post('/auth/change-password', [AuthController::class, 'changePassword'])->name('api.password.change');
Route::post('/auth/set-initial-password', [AuthController::class, 'setInitialPassword'])->name('api.password.set-initial');
Route::get('/auth/check', [AuthController::class, 'checkAuth'])->name('api.auth.check');

// Account Reactivation routes
Route::post('/reactivation/send-code', [ReactivationController::class, 'sendCode'])->name('api.reactivation.send-code');
Route::post('/reactivation/verify-code', [ReactivationController::class, 'verifyCode'])->name('api.reactivation.verify-code');
Route::post('/reactivation/check-status', [ReactivationController::class, 'checkStatus'])->name('api.reactivation.check-status');

// Password Reset routes
Route::post('/password-reset/send-code', [PasswordResetController::class, 'sendCode'])->name('api.password-reset.send-code');
Route::post('/password-reset/reset-password', [PasswordResetController::class, 'resetPassword'])->name('api.password-reset.reset-password');
Route::post('/password-reset/check-status', [PasswordResetController::class, 'checkStatus'])->name('api.password-reset.check-status');

// Profile Setup routes (authentication checked in controller)
Route::post('/profile/setup', [ProfileSetupController::class, 'setupProfile'])->name('api.profile.setup');
Route::post('/profile/skip-setup', [ProfileSetupController::class, 'skipProfileSetup'])->name('api.profile.skip-setup');
Route::post('/profile/upload-image', [ProfileSetupController::class, 'uploadImage'])->name('api.profile.upload-image');

// Google OAuth routes
Route::get('/auth/google/redirect', [GoogleAuth::class, 'redirectToGoogle'])->name('api.google.redirect');
Route::get('/auth/google/callback', [GoogleAuth::class, 'handleGoogleCallback'])->name('api.google.callback');

// Certifika routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/certifika/verify-qr', [CertifikaController::class, 'verifyQr'])->name('api.certifika.verify-qr');
    Route::get('/certifika/nfts', [CertifikaController::class, 'getUserNfts'])->name('api.certifika.nfts');
    Route::post('/certifika/sync-nfts', [CertifikaController::class, 'syncNfts'])->name('api.certifika.sync-nfts');
    Route::get('/certifika/profile', [CertifikaController::class, 'getUserProfile'])->name('api.certifika.profile');
});

// User Profile routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'getProfile'])->name('api.profile.get');
    Route::put('/profile', [ProfileController::class, 'updateProfile'])->name('api.profile.update');
    Route::post('/profile/upload-image', [ProfileController::class, 'uploadImage'])->name('api.profile.upload-image');
});

// User Settings & Account Management routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user/settings', [UserController::class, 'getSettings'])->name('api.user.settings.get');
    Route::put('/user/settings', [UserController::class, 'updateSettings'])->name('api.user.settings.update');
    Route::post('/user/deactivate', [UserController::class, 'deactivateAccount'])->name('api.user.deactivate');
    Route::delete('/user/delete', [UserController::class, 'deleteAccount'])->name('api.user.delete');
});

// User Event Management routes (require authentication)
Route::middleware('auth:sanctum')->prefix('user/events')->group(function () {
    Route::get('/', [UserEventController::class, 'index'])->name('api.user.events.index');
    Route::post('/register', [UserEventController::class, 'register'])->name('api.user.events.register');
    Route::put('/{registrationId}/status', [UserEventController::class, 'updateStatus'])->name('api.user.events.update-status');
    Route::delete('/{registrationId}/cancel', [UserEventController::class, 'cancel'])->name('api.user.events.cancel');
});

// Admin routes (require authentication and admin permissions)
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    // User management
    Route::get('/users', [UserManagementController::class, 'index'])->name('api.admin.users.index');
    Route::get('/users/stats', [UserManagementController::class, 'getStats'])->name('api.admin.users.stats');
    Route::get('/users/{id}', [UserManagementController::class, 'getUserStatus'])->name('api.admin.users.show');
    Route::post('/users/{id}/suspend', [UserManagementController::class, 'suspendUser'])->name('api.admin.users.suspend');
    Route::post('/users/{id}/unsuspend', [UserManagementController::class, 'unsuspendUser'])->name('api.admin.users.unsuspend');
    Route::post('/users/{id}/deactivate', [UserManagementController::class, 'deactivateUser'])->name('api.admin.users.deactivate');
    Route::post('/users/{id}/activate', [UserManagementController::class, 'activateUser'])->name('api.admin.users.activate');
    Route::put('/users/{id}/role', [UserManagementController::class, 'updateUserRole'])->name('api.admin.users.update-role');
});