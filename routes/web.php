<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

// API Authentication Routes (for React frontend)
Route::post('/login', [AuthController::class, 'login'])->name('login.post');
Route::post('/register', [AuthController::class, 'register'])->name('register.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
Route::post('/change-password', [AuthController::class, 'changePassword'])->name('password.change');

// API Routes for authentication status
Route::get('/api/auth/check', [AuthController::class, 'checkAuth'])->name('auth.check');

// React app routes - all frontend routing is handled by React Router
Route::get('/', function () {
    return view('app');
});

// Catch all routes for React Router
Route::get('/{path?}', function () {
    return view('app');
})->where('path', '.*');
