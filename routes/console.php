<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule the user inactivation command to run daily at 2:00 AM
Schedule::command('users:mark-inactive --force')
    ->dailyAt('02:00')
    ->description('Mark inactive users (no login for 3 months)')
    ->withoutOverlapping()
    ->runInBackground();
