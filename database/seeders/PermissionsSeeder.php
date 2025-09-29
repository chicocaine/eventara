<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();
        
        $permissions = [
            [
                'permission' => 'view_profile',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'edit_profile',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'change_password',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'view_events',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'view_venues',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'rate_venues',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            
            [
                'permission' => 'is_volunteer',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'apply_volunteer',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'view_volunteer_applications',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'manage_availability',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            
            [
                'permission' => 'admin_access',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'manage_users',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'manage_roles',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'manage_permissions',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'create_events',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'edit_events',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'delete_events',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'create_venues',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'edit_venues',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'delete_venues',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'approve_volunteer_applications',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'manage_volunteers',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'view_logs',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'permission' => 'system_settings',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        // Use insert to avoid triggering model events and for better performance
        DB::table('permissions')->insert($permissions);

        $this->command->info('✅ Permissions seeded successfully.');
        $this->command->info('   Created ' . count($permissions) . ' permissions.');
    }
}