<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RolePermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();
        
        // Get role IDs
        $roles = DB::table('roles')->pluck('role_id', 'role')->toArray();
        
        // Get permission IDs
        $permissions = DB::table('permissions')->pluck('permission_id', 'permission')->toArray();
        
        // Base permissions for 'user' role
        $userPermissions = [
            'view_profile',
            'edit_profile',
            'change_password',
            'view_events',
            'create_venues',
            'edit_venues',
            'view_venues',
            'rate_venues',
            'apply_volunteer',
        ];
        
        // Volunteer permissions (inherits user permissions + volunteer specific)
        $volunteerPermissions = array_merge($userPermissions, [
            'is_volunteer',
            'view_volunteer_applications',
            'manage_availability',
        ]);
        
        // Admin permissions (all permissions except is_volunteer)
        $adminPermissions = [
            'view_profile',
            'edit_profile',
            'change_password',
            'view_events',
            'view_venues',
            'rate_venues',
            'admin_access',
            'manage_users',
            'manage_roles',
            'manage_permissions',
            'create_events',
            'edit_events',
            'delete_events',
            'create_venues',
            'edit_venues',
            'delete_venues',
            'view_volunteer_applications',
            'approve_volunteer_applications',
            'manage_volunteers',
            'view_logs',
            'system_settings',
        ];
        
        $rolePermissionsData = [];
        
        // Assign permissions to 'user' role
        foreach ($userPermissions as $permission) {
            if (isset($permissions[$permission])) {
                $rolePermissionsData[] = [
                    'role_id' => $roles['user'],
                    'permission_id' => $permissions[$permission],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
        
        // Assign permissions to 'volunteer' role
        foreach ($volunteerPermissions as $permission) {
            if (isset($permissions[$permission])) {
                $rolePermissionsData[] = [
                    'role_id' => $roles['volunteer'],
                    'permission_id' => $permissions[$permission],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
        
        // Assign permissions to 'admin' role
        foreach ($adminPermissions as $permission) {
            if (isset($permissions[$permission])) {
                $rolePermissionsData[] = [
                    'role_id' => $roles['admin'],
                    'permission_id' => $permissions[$permission],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
        
        // Insert all role-permission relationships
        DB::table('role_permissions')->insert($rolePermissionsData);
        
        $this->command->info('✅ Role permissions seeded successfully.');
        $this->command->info('   👤 User role: ' . count($userPermissions) . ' permissions');
        $this->command->info('   🤝 Volunteer role: ' . count($volunteerPermissions) . ' permissions');
        $this->command->info('   👑 Admin role: ' . count($adminPermissions) . ' permissions');
        $this->command->info('   📋 Total role-permission relationships: ' . count($rolePermissionsData));
    }
}