<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Venue extends Model
{
    use HasFactory;

    protected $table = 'venues';
    protected $primaryKey = 'venue_id';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'created_by',
        'name',
        'description',
        'address_line1',
        'address_line2',
        'city',
        'province',
        'state_region',
        'postal_code',
        'country',
        'capacity',
        'type',
        'contact_name',
        'contact_phone',
        'contact_email',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'capacity' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who created this venue.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(UserAuth::class, 'created_by', 'user_id');
    }

    /**
     * Get the ratings for this venue.
     */
    public function ratings(): HasMany
    {
        return $this->hasMany(VenueRating::class, 'venue_id', 'venue_id');
    }

    /**
     * Get the event sessions held at this venue.
     */
    public function eventSessions(): HasMany
    {
        return $this->hasMany(EventSession::class, 'venue_id', 'venue_id');
    }

    /**
     * Get the full address attribute.
     */
    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address_line1,
            $this->address_line2,
            $this->city,
            $this->province ?? $this->state_region,
            $this->postal_code,
            $this->country,
        ]);

        return implode(', ', $parts);
    }

    /**
     * Get the average rating for this venue.
     */
    public function getAverageRatingAttribute(): ?float
    {
        $average = $this->ratings()->avg('rating');
        return $average ? round($average, 2) : null;
    }

    /**
     * Get the total number of ratings.
     */
    public function getTotalRatingsAttribute(): int
    {
        return $this->ratings()->count();
    }

    /**
     * Check if a user has rated this venue.
     */
    public function isRatedByUser(int $userId): bool
    {
        return $this->ratings()->where('user_id', $userId)->exists();
    }

    /**
     * Get a user's rating for this venue.
     */
    public function getUserRating(int $userId): ?VenueRating
    {
        return $this->ratings()->where('user_id', $userId)->first();
    }

    /**
     * Check if venue is available on a specific date.
     */
    public function isAvailableOnDate($date): bool
    {
        return !$this->eventSessions()
            ->whereDate('session_date', $date)
            ->exists();
    }

    /**
     * Get upcoming events at this venue.
     */
    public function getUpcomingEvents()
    {
        return $this->eventSessions()
            ->with('event')
            ->where('session_date', '>=', now()->toDateString())
            ->orderBy('session_date')
            ->orderBy('start_time')
            ->get()
            ->pluck('event')
            ->unique('event_id');
    }

    /**
     * Scope for filtering by type.
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope for filtering by capacity range.
     */
    public function scopeByCapacityRange($query, ?int $minCapacity, ?int $maxCapacity)
    {
        if ($minCapacity) {
            $query->where('capacity', '>=', $minCapacity);
        }
        
        if ($maxCapacity) {
            $query->where('capacity', '<=', $maxCapacity);
        }
        
        return $query;
    }

    /**
     * Scope for filtering by location.
     */
    public function scopeByLocation($query, ?string $city, ?string $country)
    {
        if ($city) {
            $query->where('city', 'ILIKE', "%{$city}%");
        }
        
        if ($country) {
            $query->where('country', 'ILIKE', "%{$country}%");
        }
        
        return $query;
    }

    /**
     * Scope for searching venues.
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'ILIKE', "%{$search}%")
              ->orWhere('description', 'ILIKE', "%{$search}%")
              ->orWhere('city', 'ILIKE', "%{$search}%")
              ->orWhere('country', 'ILIKE', "%{$search}%");
        });
    }

    /**
     * Scope for venues with minimum rating.
     */
    public function scopeWithMinimumRating($query, float $minRating)
    {
        return $query->whereHas('ratings', function ($q) use ($minRating) {
            $q->selectRaw('AVG(rating) as avg_rating')
              ->havingRaw('AVG(rating) >= ?', [$minRating]);
        });
    }
}