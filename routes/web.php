<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('app');
});

// Catch all routes for React Router (if you plan to use client-side routing)
Route::get('/{path?}', function () {
    return view('app');
})->where('path', '.*');
