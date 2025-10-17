<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\UserRepository;
use App\Repositories\ProfileRepository;
use App\Repositories\EventRepository;
use App\Repositories\UserEventRepository;
use App\Services\ProfileService;
use App\Services\UserEventService;
use App\Services\UserManagementService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register repositories
        $this->app->singleton(UserRepository::class, function ($app) {
            return new UserRepository($app->make(\App\Models\UserAuth::class));
        });

        $this->app->singleton(ProfileRepository::class, function ($app) {
            return new ProfileRepository($app->make(\App\Models\UserProfile::class));
        });

        $this->app->singleton(EventRepository::class, function ($app) {
            return new EventRepository($app->make(\App\Models\Event::class));
        });

        $this->app->singleton(UserEventRepository::class, function ($app) {
            return new UserEventRepository($app->make(\App\Models\UserEvent::class));
        });

        // Register services
        $this->app->singleton(ProfileService::class, function ($app) {
            return new ProfileService($app->make(ProfileRepository::class));
        });

        $this->app->singleton(UserEventService::class, function ($app) {
            return new UserEventService(
                $app->make(UserEventRepository::class),
                $app->make(EventRepository::class)
            );
        });

        $this->app->singleton(UserManagementService::class, function ($app) {
            return new UserManagementService(
                $app->make(UserRepository::class),
                $app->make(ProfileRepository::class),
                $app->make(\App\Services\UserInactivationService::class)
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
