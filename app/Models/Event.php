<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Event extends Model
{
    use HasFactory;

    protected $table = 'events';
    protected $primaryKey = 'event_id';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'title',
        'description',
        'start_date',
        'end_date',
        'publish_status',
        'event_status',
        'created_by',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Publish status constants.
     */
    const PUBLISH_STATUS_DRAFT = 'draft';
    const PUBLISH_STATUS_PUBLISHED = 'published';
    const PUBLISH_STATUS_CANCELLED = 'cancelled';

    /**
     * Event status constants.
     */
    const EVENT_STATUS_UPCOMING = 'upcoming';
    const EVENT_STATUS_ONGOING = 'on-going';
    const EVENT_STATUS_FINISHED = 'finished';

    /**
     * Get all possible publish statuses.
     */
    public static function getPublishStatuses(): array
    {
        return [
            self::PUBLISH_STATUS_DRAFT,
            self::PUBLISH_STATUS_PUBLISHED,
            self::PUBLISH_STATUS_CANCELLED,
        ];
    }

    /**
     * Get all possible event statuses.
     */
    public static function getEventStatuses(): array
    {
        return [
            self::EVENT_STATUS_UPCOMING,
            self::EVENT_STATUS_ONGOING,
            self::EVENT_STATUS_FINISHED,
        ];
    }

    /**
     * Get the user who created this event.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(UserAuth::class, 'created_by', 'user_id');
    }

    /**
     * Get the sessions for this event.
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(EventSession::class, 'event_id', 'event_id');
    }

    /**
     * Get user registrations for this event.
     */
    public function userEvents(): HasMany
    {
        return $this->hasMany(UserEvent::class, 'event_id', 'event_id');
    }

    /**
     * Get registered users for this event (through user_events).
     */
    public function registeredUsers()
    {
        return $this->hasManyThrough(
            UserAuth::class,
            UserEvent::class,
            'event_id',     // Foreign key on user_events table
            'user_id',      // Foreign key on users_auth table
            'event_id',     // Local key on events table
            'user_id'       // Local key on user_events table
        );
    }

    /**
     * Get the duration of the event in days.
     */
    public function getDurationDaysAttribute(): int
    {
        return $this->start_date->diffInDays($this->end_date) + 1;
    }

    /**
     * Check if event is published.
     */
    public function isPublished(): bool
    {
        return $this->publish_status === self::PUBLISH_STATUS_PUBLISHED;
    }

    /**
     * Check if event is draft.
     */
    public function isDraft(): bool
    {
        return $this->publish_status === self::PUBLISH_STATUS_DRAFT;
    }

    /**
     * Check if event is cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->publish_status === self::PUBLISH_STATUS_CANCELLED;
    }

    /**
     * Check if event is upcoming.
     */
    public function isUpcoming(): bool
    {
        return $this->event_status === self::EVENT_STATUS_UPCOMING;
    }

    /**
     * Check if event is ongoing.
     */
    public function isOngoing(): bool
    {
        return $this->event_status === self::EVENT_STATUS_ONGOING;
    }

    /**
     * Check if event is finished.
     */
    public function isFinished(): bool
    {
        return $this->event_status === self::EVENT_STATUS_FINISHED;
    }

    /**
     * Publish the event.
     */
    public function publish(): void
    {
        $this->update(['publish_status' => self::PUBLISH_STATUS_PUBLISHED]);
    }

    /**
     * Cancel the event.
     */
    public function cancel(): void
    {
        $this->update(['publish_status' => self::PUBLISH_STATUS_CANCELLED]);
    }

    /**
     * Mark event as finished.
     */
    public function finish(): void
    {
        $this->update(['event_status' => self::EVENT_STATUS_FINISHED]);
    }

    /**
     * Get unique venues used by this event.
     */
    public function getVenuesAttribute()
    {
        return $this->sessions()->with('venue')->get()
            ->pluck('venue')
            ->filter()
            ->unique('venue_id');
    }

    /**
     * Get the total session count.
     */
    public function getTotalSessionsAttribute(): int
    {
        return $this->sessions()->count();
    }

    /**
     * Check if event spans multiple days.
     */
    public function isMultiDay(): bool
    {
        return $this->start_date->ne($this->end_date);
    }

    /**
     * Get upcoming sessions.
     */
    public function getUpcomingSessions()
    {
        return $this->sessions()
            ->where('session_date', '>=', now()->toDateString())
            ->orderBy('session_date')
            ->orderBy('start_time')
            ->get();
    }

    /**
     * Scope for filtering by publish status.
     */
    public function scopeByPublishStatus($query, string $status)
    {
        return $query->where('publish_status', $status);
    }

    /**
     * Scope for published events.
     */
    public function scopePublished($query)
    {
        return $query->byPublishStatus(self::PUBLISH_STATUS_PUBLISHED);
    }

    /**
     * Scope for draft events.
     */
    public function scopeDraft($query)
    {
        return $query->byPublishStatus(self::PUBLISH_STATUS_DRAFT);
    }

    /**
     * Scope for filtering by event status.
     */
    public function scopeByEventStatus($query, string $status)
    {
        return $query->where('event_status', $status);
    }

    /**
     * Scope for upcoming events.
     */
    public function scopeUpcoming($query)
    {
        return $query->byEventStatus(self::EVENT_STATUS_UPCOMING);
    }

    /**
     * Scope for ongoing events.
     */
    public function scopeOngoing($query)
    {
        return $query->byEventStatus(self::EVENT_STATUS_ONGOING);
    }

    /**
     * Scope for events within date range.
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('start_date', [$startDate, $endDate])
              ->orWhereBetween('end_date', [$startDate, $endDate])
              ->orWhere(function ($q2) use ($startDate, $endDate) {
                  $q2->where('start_date', '<=', $startDate)
                     ->where('end_date', '>=', $endDate);
              });
        });
    }

    /**
     * Scope for searching events.
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'ILIKE', "%{$search}%")
              ->orWhere('description', 'ILIKE', "%{$search}%");
        });
    }

    /**
     * Auto-update event status based on dates.
     */
    public function updateEventStatus(): void
    {
        $now = now()->toDateString();
        
        if ($this->end_date->lt($now)) {
            $this->event_status = self::EVENT_STATUS_FINISHED;
        } elseif ($this->start_date->lte($now) && $this->end_date->gte($now)) {
            $this->event_status = self::EVENT_STATUS_ONGOING;
        } else {
            $this->event_status = self::EVENT_STATUS_UPCOMING;
        }
        
        $this->save();
    }
}