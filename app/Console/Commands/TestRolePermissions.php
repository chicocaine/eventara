<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\Permission;
use App\Models\UserAuth;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TestRolePermissions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'roles:test {--user=* : Test specific user emails}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test and display role permissions system';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔐 ROLE PERMISSIONS SYSTEM TEST');
        $this->info('================================');
        $this->newLine();

        // Display all roles and their permissions
        $this->displayRolePermissions();
        
        // Test specific users if provided
        $userEmails = $this->option('user');
        if (!empty($userEmails)) {
            $this->testSpecificUsers($userEmails);
        } else {
            $this->testDefaultUsers();
        }

        // Display permission matrix
        $this->displayPermissionMatrix();
        
        return Command::SUCCESS;
    }

    protected function displayRolePermissions()
    {
        $this->info('📋 ROLES AND PERMISSIONS OVERVIEW');
        $this->info('─────────────────────────────────');
        
        $roles = Role::with('permissions')->orderBy('role_id')->get();
        
        foreach ($roles as $role) {
            $icon = match($role->role) {
                'user' => '👤',
                'volunteer' => '🤝', 
                'admin' => '👑',
                default => '🔹'
            };
            
            $this->info("{$icon} {$role->role} (ID: {$role->role_id}) - {$role->permissions->count()} permissions");
            
            $permissions = $role->permissions->pluck('permission')->sort();
            foreach ($permissions as $permission) {
                $this->line("   • {$permission}");
            }
            $this->newLine();
        }
    }

    protected function testSpecificUsers(array $userEmails)
    {
        $this->info('👥 TESTING SPECIFIC USERS');
        $this->info('─────────────────────────');
        
        foreach ($userEmails as $email) {
            $user = UserAuth::where('email', $email)->first();
            if ($user) {
                $this->testUser($user);
            } else {
                $this->error("❌ User not found: {$email}");
            }
        }
    }

    protected function testDefaultUsers()
    {
        $this->info('👥 TESTING DEFAULT USERS');
        $this->info('────────────────────────');
        
        $testUsers = [
            'user@eventara.com',
            'volunteer@eventara.com', 
            'admin@eventara.com'
        ];
        
        foreach ($testUsers as $email) {
            $user = UserAuth::where('email', $email)->first();
            if ($user) {
                $this->testUser($user);
            } else {
                $this->warn("⚠️ Test user not found: {$email}");
                $this->line("   Run: php artisan db:seed --class=TestUsersSeeder");
            }
        }
    }

    protected function testUser(UserAuth $user)
    {
        $icon = match($user->role?->role) {
            'user' => '👤',
            'volunteer' => '🤝',
            'admin' => '👑', 
            default => '🔹'
        };
        
        $roleText = $user->role?->role ?? 'No Role';
        $this->info("{$icon} {$user->email} ({$roleText})");
        
        // Test key permissions
        $keyPermissions = [
            'view_profile' => 'View Profile',
            'is_volunteer' => 'Is Volunteer', 
            'admin_access' => 'Admin Access',
            'manage_users' => 'Manage Users',
            'apply_volunteer' => 'Apply Volunteer',
            'create_events' => 'Create Events'
        ];
        
        $results = [];
        foreach ($keyPermissions as $permission => $label) {
            $hasPermission = $user->hasPermission($permission);
            $status = $hasPermission ? '✅' : '❌';
            $results[] = "{$status} {$label}";
        }
        
        $this->line('   ' . implode(' | ', $results));
        $this->newLine();
    }

    protected function displayPermissionMatrix()
    {
        $this->info('📊 PERMISSION MATRIX');
        $this->info('────────────────────');
        
        $roles = Role::orderBy('role_id')->get();
        $permissions = Permission::orderBy('permission')->get();
        
        // Create headers
        $headers = ['Permission'];
        foreach ($roles as $role) {
            $icon = match($role->role) {
                'user' => '👤',
                'volunteer' => '🤝',
                'admin' => '👑',
                default => '🔹'
            };
            $headers[] = "{$icon} {$role->role}";
        }
        
        // Create rows
        $rows = [];
        foreach ($permissions as $permission) {
            $row = [$permission->permission];
            
            foreach ($roles as $role) {
                $hasPermission = DB::table('role_permissions')
                    ->where('role_id', $role->role_id)
                    ->where('permission_id', $permission->permission_id)
                    ->exists();
                    
                $row[] = $hasPermission ? '✅' : '❌';
            }
            
            $rows[] = $row;
        }
        
        $this->table($headers, $rows);
        
        // Summary stats
        $this->newLine();
        $this->info('📈 SUMMARY STATISTICS');
        $this->info('─────────────────────');
        
        foreach ($roles as $role) {
            $count = DB::table('role_permissions')
                ->where('role_id', $role->role_id)
                ->count();
            $icon = match($role->role) {
                'user' => '👤',
                'volunteer' => '🤝', 
                'admin' => '👑',
                default => '🔹'
            };
            $this->line("{$icon} {$role->role}: {$count} permissions");
        }
        
        $totalPermissions = $permissions->count();
        $totalRoles = $roles->count();
        $totalRelationships = DB::table('role_permissions')->count();
        
        $this->newLine();
        $this->line("📋 Total Permissions: {$totalPermissions}");
        $this->line("👥 Total Roles: {$totalRoles}"); 
        $this->line("🔗 Total Relationships: {$totalRelationships}");
    }
}
