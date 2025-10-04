<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class UserAuth extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $table = 'users_auth';
    protected $primaryKey = 'user_id';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'email',
        'password',
        'active',
        'suspended',
        'role_id',
        'email_verified_at',
        'last_login',
        'auth_provider',
        'password_set_by_user',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'password' => 'hashed',
        'active' => 'boolean',
        'suspended' => 'boolean',
        'password_set_by_user' => 'boolean',
    ];

    /**
     * Get the user's profile.
     */
    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class, 'user_id', 'user_id');
    }

    /**
     * Get the user's role.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id', 'role_id');
    }

    /**
     * Get the user's volunteer applications.
     */
    public function volunteerApplications(): HasMany
    {
        return $this->hasMany(VolunteerApplication::class, 'user_id', 'user_id');
    }

    /**
     * Get the user's volunteer record.
     */
    public function volunteer(): HasOne
    {
        return $this->hasOne(Volunteer::class, 'user_id', 'user_id');
    }

    /**
     * Get venues created by this user.
     */
    public function createdVenues(): HasMany
    {
        return $this->hasMany(Venue::class, 'created_by', 'user_id');
    }

    /**
     * Get events created by this user.
     */
    public function createdEvents(): HasMany
    {
        return $this->hasMany(Event::class, 'created_by', 'user_id');
    }

    /**
     * Get venue ratings by this user.
     */
    public function venueRatings(): HasMany
    {
        return $this->hasMany(VenueRating::class, 'user_id', 'user_id');
    }

    /**
     * Get logs for this user.
     */
    public function logs(): HasMany
    {
        return $this->hasMany(Log::class, 'user_id', 'user_id');
    }

    /**
     * Check if user has a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        return $this->role?->hasPermission($permission) ?? false;
    }

    /**
     * Check if user has a specific role.
     */
    public function hasRole(string $role): bool
    {
        return $this->role?->role === $role;
    }

    /**
     * Check if user is a volunteer.
     */
    public function isVolunteer(): bool
    {
        return $this->volunteer !== null && $this->volunteer->status === 'active';
    }

    /**
     * Get user's full name from profile.
     */
    public function getFullNameAttribute(): ?string
    {
        $profile = $this->profile;
        if (!$profile) return null;
        
        return trim(($profile->first_name ?? '') . ' ' . ($profile->last_name ?? '')) ?: null;
    }

    /**
     * Get user's display name (alias or full name or email).
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->profile?->alias 
            ?? $this->full_name 
            ?? $this->email;
    }

    /**
     * Update last login timestamp.
     */
    public function updateLastLogin(): void
    {
        $this->update(['last_login' => now()]);
    }

    /**
     * Check if user is suspended.
     */
    public function isSuspended(): bool
    {
        return (bool) $this->suspended;
    }

    /**
     * Check if user can login (active and not suspended).
     */
    public function canLogin(): bool
    {
        return (bool) $this->active && !(bool) $this->suspended;
    }

    /**
     * Suspend the user.
     */
    public function suspend(): void
    {
        $this->update(['suspended' => true]);
    }

    /**
     * Unsuspend the user.
     */
    public function unsuspend(): void
    {
        $this->update(['suspended' => false]);
    }

    /**
     * Check if user has completed their profile setup.
     */
    public function hasCompletedProfileSetup(): bool
    {
        return $this->profile !== null;
    }

    /**
     * Check if user should be marked as inactive based on last login.
     * Users are considered inactive if they haven't logged in for 3 months.
     */
    public function shouldBeInactive(): bool
    {
        if (!$this->active) {
            return false; // Already inactive
        }

        if (!$this->last_login) {
            // If no last login, check account creation date
            return $this->created_at && $this->created_at->lt(now()->subMonths(3));
        }

        return $this->last_login->lt(now()->subMonths(3));
    }

    /**
     * Mark user as inactive.
     */
    public function markInactive(): void
    {
        $this->update(['active' => false]);
    }

    /**
     * Activate the user.
     */
    public function activate(): void
    {
        $this->update(['active' => true]);
    }

    /**
     * Scope for finding users that should be marked inactive.
     */
    public function scopeShouldBeInactive($query)
    {
        $threeMonthsAgo = now()->subMonths(3);
        
        return $query->where('active', true)
            ->where(function ($q) use ($threeMonthsAgo) {
                $q->where(function ($subQ) use ($threeMonthsAgo) {
                    // Users with last_login older than 3 months
                    $subQ->whereNotNull('last_login')
                         ->where('last_login', '<', $threeMonthsAgo);
                })->orWhere(function ($subQ) use ($threeMonthsAgo) {
                    // Users with no last_login but created more than 3 months ago
                    $subQ->whereNull('last_login')
                         ->where('created_at', '<', $threeMonthsAgo);
                });
            });
    }

    /**
     * Check if user is an OAuth user (registered via social provider).
     */
    public function isOAuthUser(): bool
    {
        return !empty($this->auth_provider);
    }

    /**
     * Check if user has set their own password (vs auto-generated).
     */
    public function hasSetOwnPassword(): bool
    {
        return (bool) $this->password_set_by_user;
    }

    /**
     * Check if user can change their password (has set own password before).
     */
    public function canChangePassword(): bool
    {
        return $this->hasSetOwnPassword();
    }

    /**
     * Check if user needs to set an initial password.
     */
    public function needsToSetPassword(): bool
    {
        return $this->isOAuthUser() && !$this->hasSetOwnPassword();
    }

    /**
     * Mark that user has set their own password.
     */
    public function markPasswordAsSet(): void
    {
        $this->update(['password_set_by_user' => true]);
    }

    /**
     * Get the authentication provider name.
     */
    public function getAuthProvider(): ?string
    {
        return $this->auth_provider;
    }

    /**
     * Check if user registered via Google OAuth.
     */
    public function isGoogleUser(): bool
    {
        return $this->auth_provider === 'google';
    }
}