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
     * Age group options.
     */
    public const AGE_GROUPS = [
        '17 below', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
    ];

    /**
     * Gender options.
     */
    public const GENDERS = [
        'male', 'female', 'non-binary', 'prefer-not-to-say', 'other'
    ];

    /**
     * Occupation options.
     */
    public const OCCUPATIONS = [
        'student', 'employed', 'self-employed', 'unemployed', 'retired',
        'homemaker', 'freelancer', 'entrepreneur', 'volunteer', 'other'
    ];

    /**
     * Education level options.
     */
    public const EDUCATION_LEVELS = [
        'elementary', 'high-school', 'some-college', 'bachelors',
        'masters', 'doctorate', 'professional', 'trade-school', 'other'
    ];

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'alias',
        'first_name',
        'last_name',
        'image_url',
        'banner_url',
        'contact_phone',
        'age_group',
        'gender',
        'occupation',
        'education_level',
        'bio',
        'mailing_address',
        'links',
        'preferences',
        'certifika_wallet',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'links' => 'array',
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

    /**
     * Get all available age group options.
     */
    public static function getAgeGroupOptions(): array
    {
        return self::AGE_GROUPS;
    }

    /**
     * Get all available gender options.
     */
    public static function getGenderOptions(): array
    {
        return self::GENDERS;
    }

    /**
     * Get all available occupation options.
     */
    public static function getOccupationOptions(): array
    {
        return self::OCCUPATIONS;
    }

    /**
     * Get all available education level options.
     */
    public static function getEducationLevelOptions(): array
    {
        return self::EDUCATION_LEVELS;
    }

    /**
     * Check if profile has demographic information filled.
     */
    public function hasDemographicInfo(): bool
    {
        return !empty($this->age_group) || 
               !empty($this->gender) || 
               !empty($this->occupation) || 
               !empty($this->education_level);
    }

    /**
     * Get demographic completion percentage.
     */
    public function getDemographicCompletionAttribute(): int
    {
        $fields = ['age_group', 'gender', 'occupation', 'education_level'];
        $completed = 0;
        
        foreach ($fields as $field) {
            if (!empty($this->$field)) {
                $completed++;
            }
        }
        
        return round(($completed / count($fields)) * 100);
    }
}