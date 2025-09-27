<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VenueRating extends Model
{
    use HasFactory;

    protected $table = 'venue_rating';
    protected $primaryKey = 'rating_id';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'venue_id',
        'rating',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'rating' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Rating constants.
     */
    const MIN_RATING = 1;
    const MAX_RATING = 5;

    /**
     * Get the user who made this rating.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(UserAuth::class, 'user_id', 'user_id');
    }

    /**
     * Get the venue being rated.
     */
    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class, 'venue_id', 'venue_id');
    }

    /**
     * Get all possible rating values.
     */
    public static function getPossibleRatings(): array
    {
        return range(self::MIN_RATING, self::MAX_RATING);
    }

    /**
     * Check if rating is valid.
     */
    public function isValidRating(int $rating): bool
    {
        return $rating >= self::MIN_RATING && $rating <= self::MAX_RATING;
    }

    /**
     * Get rating as stars (for display).
     */
    public function getStarsAttribute(): string
    {
        return str_repeat('★', $this->rating) . str_repeat('☆', self::MAX_RATING - $this->rating);
    }

    /**
     * Scope for filtering by rating value.
     */
    public function scopeByRating($query, int $rating)
    {
        return $query->where('rating', $rating);
    }

    /**
     * Scope for ratings above a certain value.
     */
    public function scopeAboveRating($query, int $minRating)
    {
        return $query->where('rating', '>=', $minRating);
    }

    /**
     * Scope for ratings below a certain value.
     */
    public function scopeBelowRating($query, int $maxRating)
    {
        return $query->where('rating', '<=', $maxRating);
    }

    /**
     * Boot method to add model event listeners.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($rating) {
            if (!$rating->isValidRating($rating->rating)) {
                throw new \InvalidArgumentException("Rating must be between " . self::MIN_RATING . " and " . self::MAX_RATING);
            }
        });

        static::updating(function ($rating) {
            if (!$rating->isValidRating($rating->rating)) {
                throw new \InvalidArgumentException("Rating must be between " . self::MIN_RATING . " and " . self::MAX_RATING);
            }
        });
    }
}