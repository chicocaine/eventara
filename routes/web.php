<?php

use Illuminate\Support\Facades\Route;

// React app routes - all frontend routing is handled by React Router
Route::get('/', function () {
    return view('app');
});

// Catch all routes for React Router (must be last)
Route::get('/{path?}', function () {
    return view('app');
})->where('path', '.*');
