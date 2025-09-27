<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    use HasFactory;

    protected $table = 'users_profile';
    protected $primaryKey = 'id';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'alias',
        'first_name',
        'last_name',
        'image_url',
        'bio',
        'preferences',
        'certifika_wallet',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'preferences' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that owns the profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(UserAuth::class, 'user_id', 'user_id');
    }

    /**
     * Get the full name attribute.
     */
    public function getFullNameAttribute(): ?string
    {
        return trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? '')) ?: null;
    }

    /**
     * Get the display name attribute.
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->alias ?? $this->full_name ?? $this->user->email;
    }

    /**
     * Check if profile has a complete name.
     */
    public function hasCompleteName(): bool
    {
        return !empty($this->first_name) && !empty($this->last_name);
    }

    /**
     * Get initials from the name.
     */
    public function getInitialsAttribute(): string
    {
        $initials = '';
        
        if ($this->first_name) {
            $initials .= strtoupper(substr($this->first_name, 0, 1));
        }
        
        if ($this->last_name) {
            $initials .= strtoupper(substr($this->last_name, 0, 1));
        }
        
        return $initials ?: strtoupper(substr($this->alias ?? $this->user->email, 0, 2));
    }

    /**
     * Scope for searching profiles.
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('alias', 'ILIKE', "%{$search}%")
              ->orWhere('first_name', 'ILIKE', "%{$search}%")
              ->orWhere('last_name', 'ILIKE', "%{$search}%");
        });
    }
}