<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserEvent extends Model
{
    use HasFactory;

    protected $table = 'user_events';
    protected $primaryKey = 'user_event_id';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'event_id',
        'session_id',
        'status',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Available status values for user events.
     */
    public const STATUS_REGISTERED = 'registered';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_ATTENDED = 'attended';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_NO_SHOW = 'no-show';
    public const STATUS_WAITLISTED = 'waitlisted';
    public const STATUS_DECLINED = 'declined';

    /**
     * Get all available status values.
     */
    public static function getStatusOptions(): array
    {
        return [
            self::STATUS_REGISTERED,
            self::STATUS_CONFIRMED,
            self::STATUS_ATTENDED,
            self::STATUS_CANCELLED,
            self::STATUS_NO_SHOW,
            self::STATUS_WAITLISTED,
            self::STATUS_DECLINED,
        ];
    }

    /**
     * Get the user that owns this registration.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(UserAuth::class, 'user_id', 'user_id');
    }

    /**
     * Get the event for this registration.
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'event_id', 'event_id');
    }

    /**
     * Get the event session for this registration.
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(EventSession::class, 'session_id', 'session_id');
    }

    /**
     * Scope for active registrations (not cancelled or declined).
     */
    public function scopeActive($query)
    {
        return $query->whereNotIn('status', [self::STATUS_CANCELLED, self::STATUS_DECLINED]);
    }

    /**
     * Scope for confirmed registrations.
     */
    public function scopeConfirmed($query)
    {
        return $query->where('status', self::STATUS_CONFIRMED);
    }

    /**
     * Scope for attended registrations.
     */
    public function scopeAttended($query)
    {
        return $query->where('status', self::STATUS_ATTENDED);
    }

    /**
     * Check if the registration is active.
     */
    public function isActive(): bool
    {
        return !in_array($this->status, [self::STATUS_CANCELLED, self::STATUS_DECLINED]);
    }

    /**
     * Check if the user attended the event.
     */
    public function hasAttended(): bool
    {
        return $this->status === self::STATUS_ATTENDED;
    }
}
