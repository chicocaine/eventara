<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class VolunteerAvailability extends Model
{
    use HasFactory;

    protected $table = 'volunteer_availability';
    protected $primaryKey = 'availability_id';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'volunteer_id',
        'date',
        'start_time',
        'end_time',
        'status',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'date' => 'date',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Availability status constants.
     */
    const STATUS_AVAILABLE = 'available';
    const STATUS_UNAVAILABLE = 'unavailable';

    /**
     * Get all possible statuses.
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_AVAILABLE,
            self::STATUS_UNAVAILABLE,
        ];
    }

    /**
     * Get the volunteer that owns this availability.
     */
    public function volunteer(): BelongsTo
    {
        return $this->belongsTo(Volunteer::class, 'volunteer_id', 'volunteer_id');
    }

    /**
     * Check if this slot is available.
     */
    public function isAvailable(): bool
    {
        return $this->status === self::STATUS_AVAILABLE;
    }

    /**
     * Check if this slot is unavailable.
     */
    public function isUnavailable(): bool
    {
        return $this->status === self::STATUS_UNAVAILABLE;
    }

    /**
     * Mark as available.
     */
    public function markAvailable(): void
    {
        $this->update(['status' => self::STATUS_AVAILABLE]);
    }

    /**
     * Mark as unavailable.
     */
    public function markUnavailable(): void
    {
        $this->update(['status' => self::STATUS_UNAVAILABLE]);
    }

    /**
     * Get duration in hours.
     */
    public function getDurationHoursAttribute(): float
    {
        $start = Carbon::parse($this->start_time);
        $end = Carbon::parse($this->end_time);
        
        return $end->diffInMinutes($start) / 60;
    }

    /**
     * Check if availability overlaps with given time range.
     */
    public function overlaps(string $startTime, string $endTime): bool
    {
        $thisStart = Carbon::parse($this->start_time);
        $thisEnd = Carbon::parse($this->end_time);
        $checkStart = Carbon::parse($startTime);
        $checkEnd = Carbon::parse($endTime);

        return $thisStart->lt($checkEnd) && $thisEnd->gt($checkStart);
    }

    /**
     * Scope for filtering by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for available slots.
     */
    public function scopeAvailable($query)
    {
        return $query->byStatus(self::STATUS_AVAILABLE);
    }

    /**
     * Scope for filtering by date range.
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    /**
     * Scope for future availability.
     */
    public function scopeFuture($query)
    {
        return $query->where('date', '>=', now()->toDateString());
    }
}