<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Volunteer extends Model
{
    use HasFactory;

    protected $table = 'volunteers';
    protected $primaryKey = 'volunteer_id';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'email',
        'contact_phone',
        'role',
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
     * Volunteer status constants.
     */
    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';
    const STATUS_SUSPENDED = 'suspended';

    /**
     * Get all possible statuses.
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_ACTIVE,
            self::STATUS_INACTIVE,
            self::STATUS_SUSPENDED,
        ];
    }

    /**
     * Get the user associated with this volunteer.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(UserAuth::class, 'user_id', 'user_id');
    }

    /**
     * Get the volunteer's availability records.
     */
    public function availability(): HasMany
    {
        return $this->hasMany(VolunteerAvailability::class, 'volunteer_id', 'volunteer_id');
    }

    /**
     * Check if volunteer is active.
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Check if volunteer is inactive.
     */
    public function isInactive(): bool
    {
        return $this->status === self::STATUS_INACTIVE;
    }

    /**
     * Check if volunteer is suspended.
     */
    public function isSuspended(): bool
    {
        return $this->status === self::STATUS_SUSPENDED;
    }

    /**
     * Activate the volunteer.
     */
    public function activate(): void
    {
        $this->update(['status' => self::STATUS_ACTIVE]);
    }

    /**
     * Deactivate the volunteer.
     */
    public function deactivate(): void
    {
        $this->update(['status' => self::STATUS_INACTIVE]);
    }

    /**
     * Suspend the volunteer.
     */
    public function suspend(): void
    {
        $this->update(['status' => self::STATUS_SUSPENDED]);
    }

    /**
     * Get availability for a specific date.
     */
    public function getAvailabilityForDate($date)
    {
        return $this->availability()->whereDate('date', $date)->get();
    }

    /**
     * Check if volunteer is available on a specific date.
     */
    public function isAvailableOnDate($date): bool
    {
        return $this->availability()
            ->whereDate('date', $date)
            ->where('status', 'available')
            ->exists();
    }

    /**
     * Scope for filtering by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for active volunteers.
     */
    public function scopeActive($query)
    {
        return $query->byStatus(self::STATUS_ACTIVE);
    }

    /**
     * Scope for filtering by role.
     */
    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }
}