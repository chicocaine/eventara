<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    use HasFactory;

    protected $table = 'permissions';
    protected $primaryKey = 'permission_id';
    
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'permission',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the roles for the permission.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            Role::class,
            'role_permissions',
            'permission_id',
            'role_id',
            'permission_id',
            'role_id'
        );
    }

    /**
     * Scope for filtering permissions by name.
     */
    public function scopeByName($query, string $permission)
    {
        return $query->where('permission', $permission);
    }
}