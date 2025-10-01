<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\GoogleAuth;

// React app routes - all frontend routing is handled by React Router
Route::get('/', function () {
    return view('app');
});

// Google OAuth routes
Route::get('/auth/google', [GoogleAuth::class, 'redirectToGoogle'])->name('google.redirect');
Route::get('/auth/google/callback', [GoogleAuth::class, 'handleGoogleCallback'])->name('google.callback');
Route::get('/auth/google/debug', [GoogleAuth::class, 'debugOAuth'])->name('google.debug'); // Debug route

// Catch all routes for React Router (must be last)
Route::get('/{path?}', function () {
    return view('app');
})->where('path', '.*');
