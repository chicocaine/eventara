<?php

namespace App\Console\Commands;

use App\Models\UserAuth;
use App\Services\UserInactivationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class MarkInactiveUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:mark-inactive 
                           {--dry-run : Show which users would be marked inactive without actually updating them}
                           {--force : Force the operation without confirmation}
                           {--stats : Show inactivity statistics}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mark users as inactive if they haven\'t logged in for 3 months';

    /**
     * The user inactivation service.
     */
    protected UserInactivationService $inactivationService;

    /**
     * Create a new command instance.
     */
    public function __construct(UserInactivationService $inactivationService)
    {
        parent::__construct();
        $this->inactivationService = $inactivationService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if ($this->option('stats')) {
            return $this->showStats();
        }

        $isDryRun = $this->option('dry-run');
        $isForced = $this->option('force');

        $this->info('Checking for users who should be marked as inactive...');
        $this->info('Criteria: No login activity for 3 months or account created more than 3 months ago with no login');

        // Get users that should be marked inactive
        $usersToInactivate = $this->inactivationService->getUsersToInactivate();

        if ($usersToInactivate->isEmpty()) {
            $this->info('✅ No users found that need to be marked inactive.');
            return Command::SUCCESS;
        }

        $this->info("Found {$usersToInactivate->count()} user(s) that should be marked inactive:");
        $this->newLine();

        // Display users in a table
        $this->displayUsersTable($usersToInactivate);

        if ($isDryRun) {
            $this->warn('🔍 DRY RUN: No users were actually marked inactive.');
            return Command::SUCCESS;
        }

        // Confirm before proceeding (unless forced)
        if (!$isForced && !$this->confirm('Do you want to mark these users as inactive?')) {
            $this->info('Operation cancelled.');
            return Command::SUCCESS;
        }

        // Mark users as inactive using the service
        $stats = $this->inactivationService->markInactiveUsers(false);

        $this->newLine();
        $this->info("✅ Successfully marked {$stats['marked_inactive']} user(s) as inactive.");

        if (!empty($stats['errors'])) {
            $this->error("❌ Failed to mark " . count($stats['errors']) . " user(s) as inactive:");
            foreach ($stats['errors'] as $error) {
                $this->error("  - {$error['email']} (ID: {$error['user_id']}): {$error['error']}");
            }
        }

        if ($stats['marked_inactive'] > 0) {
            $this->info('💡 These users can reactivate their accounts by visiting the reactivation page.');
        }

        return Command::SUCCESS;
    }

    /**
     * Display statistics about user inactivity.
     */
    private function showStats(): int
    {
        $stats = $this->inactivationService->getInactivityStats();

        $this->info('User Inactivity Statistics');
        $this->info('=' . str_repeat('=', 25));
        $this->newLine();

        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Users', $stats['total_users']],
                ['Active Users', $stats['active_users']],
                ['Inactive Users', $stats['inactive_users']],
                ['Users Should Be Inactive', $stats['users_should_be_inactive']],
            ]
        );

        $this->newLine();
        $this->info("Inactivity Threshold: {$stats['threshold_months']} months");
        $this->info("Threshold Date: {$stats['threshold_date']}");

        return Command::SUCCESS;
    }

    /**
     * Display users in a formatted table.
     */
    private function displayUsersTable($users): void
    {
        $tableData = [];
        foreach ($users as $user) {
            $lastLogin = $user->last_login ? $user->last_login->format('Y-m-d H:i:s') : 'Never';
            $createdAt = $user->created_at->format('Y-m-d H:i:s');
            
            $tableData[] = [
                'ID' => $user->user_id,
                'Email' => $user->email,
                'Last Login' => $lastLogin,
                'Created At' => $createdAt,
                'Days Since Last Activity' => $this->getDaysSinceLastActivity($user),
            ];
        }

        $this->table(
            ['ID', 'Email', 'Last Login', 'Created At', 'Days Since Last Activity'],
            $tableData
        );
    }

    /**
     * Get the number of days since the user's last activity.
     */
    private function getDaysSinceLastActivity(UserAuth $user): int
    {
        $lastActivity = $user->last_login ?? $user->created_at;
        return now()->diffInDays($lastActivity);
    }
}