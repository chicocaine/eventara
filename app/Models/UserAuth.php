<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class UserAuth extends Authenticatable
{
    use HasFactory, Notifiable;

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
        'suspended' => 'boolean'
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
}