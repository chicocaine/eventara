<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\ProfileSetupController;
use App\Http\Controllers\Auth\ReactivationController;
use App\Http\Controllers\Auth\GoogleAuth;
use App\Http\Controllers\CertifikaController;
use Illuminate\Support\Facades\Route;

// Authentication routes
Route::post('/auth/login', [AuthController::class, 'login'])->name('api.login');
Route::post('/auth/register', [AuthController::class, 'register'])->name('api.register');
Route::post('/auth/logout', [AuthController::class, 'logout'])->name('api.logout');
Route::post('/auth/change-password', [AuthController::class, 'changePassword'])->name('api.password.change');
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