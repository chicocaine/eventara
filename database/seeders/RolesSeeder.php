<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();
        
        $roles = [
            [
                'role' => 'user',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'role' => 'volunteer',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'role' => 'admin',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        // Use insert to avoid triggering model events and for better performance
        DB::table('roles')->insert($roles);

        $this->command->info('✅ Roles seeded successfully.');
        $this->command->info('   Created roles: user, volunteer, admin');
    }
}