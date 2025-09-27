<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use HasFactory;

    protected $table = 'roles';
    protected $primaryKey = 'role_id';
    
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'role',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the permissions for the role.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(
            Permission::class,
            'role_permissions',
            'role_id',
            'permission_id',
            'role_id',
            'permission_id'
        );
    }

    /**
     * Get the users for the role.
     */
    public function users(): HasMany
    {
        return $this->hasMany(UserAuth::class, 'role_id', 'role_id');
    }

    /**
     * Check if role has a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        return $this->permissions()->where('permission', $permission)->exists();
    }

    /**
     * Check if role has any of the given permissions.
     */
    public function hasAnyPermission(array $permissions): bool
    {
        return $this->permissions()->whereIn('permission', $permissions)->exists();
    }

    /**
     * Check if role has all of the given permissions.
     */
    public function hasAllPermissions(array $permissions): bool
    {
        return $this->permissions()->whereIn('permission', $permissions)->count() === count($permissions);
    }
}