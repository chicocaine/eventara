<?php

namespace App\Services;

use App\Models\UserAuth;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Log;

class UserInactivationService
{
    /**
     * Number of months after which a user should be marked inactive.
     */
    const INACTIVITY_THRESHOLD_MONTHS = 3;

    /**
     * Get all users that should be marked as inactive.
     *
     * @return Collection<UserAuth>
     */
    public function getUsersToInactivate(): Collection
    {
        return UserAuth::query()->shouldBeInactive()->get();
    }

    /**
     * Mark users as inactive based on inactivity criteria.
     *
     * @param bool $dryRun If true, don't actually mark users inactive
     * @return array Statistics about the operation
     */
    public function markInactiveUsers(bool $dryRun = false): array
    {
        $usersToInactivate = $this->getUsersToInactivate();
        $stats = [
            'total_found' => $usersToInactivate->count(),
            'marked_inactive' => 0,
            'errors' => [],
        ];

        if ($usersToInactivate->isEmpty()) {
            return $stats;
        }

        if ($dryRun) {
            return $stats;
        }

        foreach ($usersToInactivate as $user) {
            try {
                $this->markUserInactive($user);
                $stats['marked_inactive']++;
            } catch (\Exception $e) {
                $stats['errors'][] = [
                    'user_id' => $user->user_id,
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                ];

                Log::error('Failed to mark user as inactive', [
                    'user_id' => $user->user_id,
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $stats;
    }

    /**
     * Mark a specific user as inactive.
     *
     * @param UserAuth $user
     * @return bool
     */
    public function markUserInactive(UserAuth $user): bool
    {
        if (!$user->active) {
            return true; // Already inactive
        }

        $user->markInactive();

        Log::info('User marked as inactive by automated process', [
            'user_id' => $user->user_id,
            'email' => $user->email,
            'last_login' => $user->last_login?->toISOString(),
            'created_at' => $user->created_at->toISOString(),
            'marked_inactive_at' => now()->toISOString(),
            'inactivity_threshold_months' => self::INACTIVITY_THRESHOLD_MONTHS,
        ]);

        return true;
    }

    /**
     * Check if a specific user should be marked as inactive.
     *
     * @param UserAuth $user
     * @return bool
     */
    public function shouldUserBeInactive(UserAuth $user): bool
    {
        return $user->shouldBeInactive();
    }

    /**
     * Get statistics about inactive users.
     *
     * @return array
     */
    public function getInactivityStats(): array
    {
        $threeMonthsAgo = now()->subMonths(self::INACTIVITY_THRESHOLD_MONTHS);

        return [
            'total_users' => UserAuth::count(),
            'active_users' => UserAuth::where('active', true)->count(),
            'inactive_users' => UserAuth::where('active', false)->count(),
            'users_should_be_inactive' => $this->getUsersToInactivate()->count(),
            'threshold_date' => $threeMonthsAgo->toDateString(),
            'threshold_months' => self::INACTIVITY_THRESHOLD_MONTHS,
        ];
    }
}