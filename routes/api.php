<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\ReactivationController;
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