<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VolunteerApplication extends Model
{
    use HasFactory;

    protected $table = 'volunteer_applications';
    protected $primaryKey = 'application_id';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'status',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Application status constants.
     */
    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';

    /**
     * Get all possible statuses.
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_APPROVED,
            self::STATUS_REJECTED,
        ];
    }

    /**
     * Get the user that submitted this application.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(UserAuth::class, 'user_id', 'user_id');
    }

    /**
     * Check if application is pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if application is approved.
     */
    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    /**
     * Check if application is rejected.
     */
    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    /**
     * Approve the application.
     */
    public function approve(): void
    {
        $this->update(['status' => self::STATUS_APPROVED]);
    }

    /**
     * Reject the application.
     */
    public function reject(): void
    {
        $this->update(['status' => self::STATUS_REJECTED]);
    }

    /**
     * Scope for filtering by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for pending applications.
     */
    public function scopePending($query)
    {
        return $query->byStatus(self::STATUS_PENDING);
    }

    /**
     * Scope for approved applications.
     */
    public function scopeApproved($query)
    {
        return $query->byStatus(self::STATUS_APPROVED);
    }

    /**
     * Scope for rejected applications.
     */
    public function scopeRejected($query)
    {
        return $query->byStatus(self::STATUS_REJECTED);
    }
}