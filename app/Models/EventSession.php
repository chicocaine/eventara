<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class EventSession extends Model
{
    use HasFactory;

    protected $table = 'event_sessions';
    protected $primaryKey = 'session_id';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'event_id',
        'venue_id',
        'session_date',
        'start_time',
        'end_time',
        'title',
        'description',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'session_date' => 'date',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the event this session belongs to.
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'event_id', 'event_id');
    }

    /**
     * Get the venue where this session takes place.
     */
    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class, 'venue_id', 'venue_id');
    }

    /**
     * Get the duration of the session in hours.
     */
    public function getDurationHoursAttribute(): float
    {
        $start = Carbon::parse($this->start_time);
        $end = Carbon::parse($this->end_time);
        
        return $end->diffInMinutes($start) / 60;
    }

    /**
     * Get the full session datetime for start.
     */
    public function getStartDateTimeAttribute(): Carbon
    {
        return Carbon::parse($this->session_date->toDateString() . ' ' . $this->start_time->format('H:i:s'));
    }

    /**
     * Get the full session datetime for end.
     */
    public function getEndDateTimeAttribute(): Carbon
    {
        return Carbon::parse($this->session_date->toDateString() . ' ' . $this->end_time->format('H:i:s'));
    }

    /**
     * Check if session is today.
     */
    public function isToday(): bool
    {
        return $this->session_date->isToday();
    }

    /**
     * Check if session is in the past.
     */
    public function isPast(): bool
    {
        return $this->end_date_time->isPast();
    }

    /**
     * Check if session is in the future.
     */
    public function isFuture(): bool
    {
        return $this->start_date_time->isFuture();
    }

    /**
     * Check if session is currently ongoing.
     */
    public function isOngoing(): bool
    {
        $now = now();
        return $now->between($this->start_date_time, $this->end_date_time);
    }

    /**
     * Check if session conflicts with another session time.
     */
    public function conflictsWith(EventSession $otherSession): bool
    {
        if (!$this->session_date->eq($otherSession->session_date)) {
            return false;
        }

        $thisStart = Carbon::parse($this->start_time);
        $thisEnd = Carbon::parse($this->end_time);
        $otherStart = Carbon::parse($otherSession->start_time);
        $otherEnd = Carbon::parse($otherSession->end_time);

        return $thisStart->lt($otherEnd) && $thisEnd->gt($otherStart);
    }

    /**
     * Get formatted time range.
     */
    public function getTimeRangeAttribute(): string
    {
        return $this->start_time->format('H:i') . ' - ' . $this->end_time->format('H:i');
    }

    /**
     * Get formatted date and time.
     */
    public function getFormattedDateTimeAttribute(): string
    {
        return $this->session_date->format('M j, Y') . ' at ' . $this->time_range;
    }

    /**
     * Scope for sessions on a specific date.
     */
    public function scopeOnDate($query, $date)
    {
        return $query->whereDate('session_date', $date);
    }

    /**
     * Scope for sessions between dates.
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('session_date', [$startDate, $endDate]);
    }

    /**
     * Scope for upcoming sessions.
     */
    public function scopeUpcoming($query)
    {
        return $query->where('session_date', '>=', now()->toDateString());
    }

    /**
     * Scope for past sessions.
     */
    public function scopePast($query)
    {
        return $query->where('session_date', '<', now()->toDateString());
    }

    /**
     * Scope for sessions at a specific venue.
     */
    public function scopeAtVenue($query, int $venueId)
    {
        return $query->where('venue_id', $venueId);
    }

    /**
     * Scope for sessions within time range.
     */
    public function scopeBetweenTimes($query, string $startTime, string $endTime)
    {
        return $query->where('start_time', '>=', $startTime)
                    ->where('end_time', '<=', $endTime);
    }

    /**
     * Scope for searching sessions.
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'ILIKE', "%{$search}%")
              ->orWhere('description', 'ILIKE', "%{$search}%");
        });
    }

    /**
     * Scope for ordering by session date and time.
     */
    public function scopeOrderByDateTime($query, string $direction = 'asc')
    {
        return $query->orderBy('session_date', $direction)
                    ->orderBy('start_time', $direction);
    }
}