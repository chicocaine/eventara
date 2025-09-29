<?php

namespace Database\Seeders;

use App\Models\UserAuth;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class TestUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();
        
        // Get role IDs
        $userRole = Role::where('role', 'user')->first();
        $volunteerRole = Role::where('role', 'volunteer')->first();
        $adminRole = Role::where('role', 'admin')->first();
        
        $testUsers = [
            [
                'email' => 'user@eventara.com',
                'password' => Hash::make('password123'),
                'active' => true,
                'suspended' => false,
                'role_id' => $userRole->role_id,
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'email' => 'volunteer@eventara.com',
                'password' => Hash::make('password123'),
                'active' => true,
                'suspended' => false,
                'role_id' => $volunteerRole->role_id,
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'email' => 'admin@eventara.com',
                'password' => Hash::make('password123'),
                'active' => true,
                'suspended' => false,
                'role_id' => $adminRole->role_id,
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];
        
        foreach ($testUsers as $userData) {
            // Check if user already exists
            if (!UserAuth::where('email', $userData['email'])->exists()) {
                UserAuth::create($userData);
                $this->command->info('✅ Created test user: ' . $userData['email']);
            } else {
                $this->command->info('⚠️ User already exists: ' . $userData['email']);
            }
        }
        
        $this->command->info('');
        $this->command->info('Test users created with password: password123');
        $this->command->info('- user@eventara.com (User role)');
        $this->command->info('- volunteer@eventara.com (Volunteer role)');  
        $this->command->info('- admin@eventara.com (Admin role)');
    }
}