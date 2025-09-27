<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Log extends Model
{
    use HasFactory;

    protected $table = 'logs';
    protected $primaryKey = 'log_id';
    
    // Disable updated_at since we only track creation
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'log_type',
        'user_id',
        'entity_type',
        'entity_id',
        'ip_address',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'created_at' => 'datetime',
        'metadata' => 'array',
    ];

    /**
     * Log type constants.
     */
    const TYPE_LOGIN = 'login';
    const TYPE_LOGOUT = 'logout';
    const TYPE_CREATE = 'create';
    const TYPE_UPDATE = 'update';
    const TYPE_DELETE = 'delete';
    const TYPE_VIEW = 'view';
    const TYPE_EXPORT = 'export';
    const TYPE_IMPORT = 'import';

    /**
     * Entity type constants.
     */
    const ENTITY_USER = 'user';
    const ENTITY_EVENT = 'event';
    const ENTITY_VENUE = 'venue';
    const ENTITY_VOLUNTEER = 'volunteer';
    const ENTITY_ROLE = 'role';
    const ENTITY_PERMISSION = 'permission';

    /**
     * Get all possible log types.
     */
    public static function getLogTypes(): array
    {
        return [
            self::TYPE_LOGIN,
            self::TYPE_LOGOUT,
            self::TYPE_CREATE,
            self::TYPE_UPDATE,
            self::TYPE_DELETE,
            self::TYPE_VIEW,
            self::TYPE_EXPORT,
            self::TYPE_IMPORT,
        ];
    }

    /**
     * Get all possible entity types.
     */
    public static function getEntityTypes(): array
    {
        return [
            self::ENTITY_USER,
            self::ENTITY_EVENT,
            self::ENTITY_VENUE,
            self::ENTITY_VOLUNTEER,
            self::ENTITY_ROLE,
            self::ENTITY_PERMISSION,
        ];
    }

    /**
     * Get the user who performed the action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(UserAuth::class, 'user_id', 'user_id');
    }

    /**
     * Get the entity that was acted upon (polymorphic).
     * Note: This is a generic approach since we store entity_type and entity_id
     */
    public function getEntity()
    {
        switch ($this->entity_type) {
            case self::ENTITY_USER:
                return UserAuth::find($this->entity_id);
            case self::ENTITY_EVENT:
                return Event::find($this->entity_id);
            case self::ENTITY_VENUE:
                return Venue::find($this->entity_id);
            case self::ENTITY_VOLUNTEER:
                return Volunteer::find($this->entity_id);
            case self::ENTITY_ROLE:
                return Role::find($this->entity_id);
            case self::ENTITY_PERMISSION:
                return Permission::find($this->entity_id);
            default:
                return null;
        }
    }

    /**
     * Create a log entry.
     */
    public static function createLog(
        string $logType,
        ?int $userId,
        string $entityType,
        int $entityId,
        ?string $ipAddress = null,
        ?array $metadata = null
    ): self {
        return static::create([
            'log_type' => $logType,
            'user_id' => $userId,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'ip_address' => $ipAddress,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Log a login action.
     */
    public static function logLogin(int $userId, ?string $ipAddress = null, ?array $metadata = null): self
    {
        return self::createLog(
            self::TYPE_LOGIN,
            $userId,
            self::ENTITY_USER,
            $userId,
            $ipAddress,
            $metadata
        );
    }

    /**
     * Log a logout action.
     */
    public static function logLogout(int $userId, ?string $ipAddress = null, ?array $metadata = null): self
    {
        return self::createLog(
            self::TYPE_LOGOUT,
            $userId,
            self::ENTITY_USER,
            $userId,
            $ipAddress,
            $metadata
        );
    }

    /**
     * Log a create action.
     */
    public static function logCreate(
        int $userId,
        string $entityType,
        int $entityId,
        ?string $ipAddress = null,
        ?array $metadata = null
    ): self {
        return self::createLog(
            self::TYPE_CREATE,
            $userId,
            $entityType,
            $entityId,
            $ipAddress,
            $metadata
        );
    }

    /**
     * Log an update action.
     */
    public static function logUpdate(
        int $userId,
        string $entityType,
        int $entityId,
        ?string $ipAddress = null,
        ?array $metadata = null
    ): self {
        return self::createLog(
            self::TYPE_UPDATE,
            $userId,
            $entityType,
            $entityId,
            $ipAddress,
            $metadata
        );
    }

    /**
     * Log a delete action.
     */
    public static function logDelete(
        int $userId,
        string $entityType,
        int $entityId,
        ?string $ipAddress = null,
        ?array $metadata = null
    ): self {
        return self::createLog(
            self::TYPE_DELETE,
            $userId,
            $entityType,
            $entityId,
            $ipAddress,
            $metadata
        );
    }

    /**
     * Get a human-readable description of the log entry.
     */
    public function getDescriptionAttribute(): string
    {
        $userName = $this->user ? $this->user->display_name : 'System';
        $action = ucfirst($this->log_type);
        $entityType = ucfirst($this->entity_type);
        
        return "{$userName} {$action}d {$entityType} #{$this->entity_id}";
    }

    /**
     * Scope for filtering by log type.
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('log_type', $type);
    }

    /**
     * Scope for filtering by entity type.
     */
    public function scopeByEntityType($query, string $entityType)
    {
        return $query->where('entity_type', $entityType);
    }

    /**
     * Scope for filtering by user.
     */
    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for filtering by date range.
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Scope for recent logs.
     */
    public function scopeRecent($query, int $hours = 24)
    {
        return $query->where('created_at', '>=', now()->subHours($hours));
    }

    /**
     * Scope for ordering by latest first.
     */
    public function scopeLatest($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Boot method to set created_at automatically.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($log) {
            $log->created_at = now();
        });
    }
}