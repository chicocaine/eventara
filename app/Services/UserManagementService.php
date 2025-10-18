<?php

namespace App\Services;

use App\Models\UserAuth;
use App\Repositories\UserRepository;
use App\Repositories\ProfileRepository;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Pagination\LengthAwarePaginator;

class UserManagementService
{
    protected UserRepository $userRepository;
    protected ProfileRepository $profileRepository;
    protected UserInactivationService $inactivationService;

    public function __construct(
        UserRepository $userRepository,
        ProfileRepository $profileRepository,
        UserInactivationService $inactivationService
    ) {
        $this->userRepository = $userRepository;
        $this->profileRepository = $profileRepository;
        $this->inactivationService = $inactivationService;
    }

    /**
     * Get paginated list of users with filters.
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getPaginatedUsers(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        // Ensure per page doesn't exceed maximum
        $perPage = min($perPage, 100);

        return $this->userRepository->getPaginatedUsers($filters, $perPage);
    }

    /**
     * Get user details by ID.
     *
     * @param int $userId
     * @return UserAuth
     * @throws \Exception
     */
    public function getUserById(int $userId): UserAuth
    {
        $user = $this->userRepository->findWithRelations($userId, ['profile', 'role']);

        if (!$user) {
            throw new \Exception('User not found.');
        }

        return $user;
    }

    /**
     * Deactivate a user account.
     *
     * @param int $userId
     * @return UserAuth
     * @throws \Exception
     */
    public function deactivateUser(int $userId): UserAuth
    {
        $user = $this->getUserById($userId);

        if (!$user->active) {
            throw new \Exception('User account is already inactive.');
        }

        // Use the inactivation service for proper deactivation
        $this->inactivationService->markUserInactive($user);

        // Invalidate all active sessions for this user
        $this->invalidateUserSessions($user);

        Log::info('User account deactivated by admin', [
            'user_id' => $userId,
            'email' => $user->email,
        ]);

        $user->refresh();
        return $user;
    }

    /**
     * Activate a user account.
     *
     * @param int $userId
     * @return UserAuth
     * @throws \Exception
     */
    public function activateUser(int $userId): UserAuth
    {
        $user = $this->getUserById($userId);

        if ($user->active) {
            throw new \Exception('User account is already active.');
        }

        if ($user->suspended) {
            throw new \Exception('Cannot activate a suspended account. Please unsuspend first.');
        }

        $user->active = true;
        $user->save();

        Log::info('User account activated by admin', [
            'user_id' => $userId,
            'email' => $user->email,
        ]);

        return $user;
    }

    /**
     * Suspend a user account.
     *
     * @param int $userId
     * @param string|null $reason
     * @return UserAuth
     * @throws \Exception
     */
    public function suspendUser(int $userId, ?string $reason = null): UserAuth
    {
        $user = $this->getUserById($userId);

        if ($user->suspended) {
            throw new \Exception('User account is already suspended.');
        }

        $user->suspended = true;
        $user->active = false;
        $user->save();

        // Invalidate all active sessions for this user
        $this->invalidateUserSessions($user);

        Log::warning('User account suspended by admin', [
            'user_id' => $userId,
            'email' => $user->email,
            'reason' => $reason,
        ]);

        return $user;
    }

    /**
     * Unsuspend a user account.
     *
     * @param int $userId
     * @return UserAuth
     * @throws \Exception
     */
    public function unsuspendUser(int $userId): UserAuth
    {
        $user = $this->getUserById($userId);

        if (!$user->suspended) {
            throw new \Exception('User account is not suspended.');
        }

        $user->suspended = false;
        $user->active = true;
        $user->save();

        Log::info('User account unsuspended by admin', [
            'user_id' => $userId,
            'email' => $user->email,
        ]);

        return $user;
    }

    /**
     * Update user's role.
     *
     * @param int $userId
     * @param int $roleId
     * @return UserAuth
     * @throws \Exception
     */
    public function updateUserRole(int $userId, int $roleId): UserAuth
    {
        $user = $this->getUserById($userId);

        $user->role_id = $roleId;
        $user->save();

        Log::info('User role updated by admin', [
            'user_id' => $userId,
            'email' => $user->email,
            'new_role_id' => $roleId,
        ]);

        $user->refresh();
        return $user;
    }

    /**
     * Delete a user account permanently.
     *
     * @param int $userId
     * @return bool
     * @throws \Exception
     */
    public function deleteUser(int $userId): bool
    {
        $user = $this->getUserById($userId);

        Log::warning('User account deleted by admin', [
            'user_id' => $userId,
            'email' => $user->email,
        ]);

        return $this->userRepository->delete($user);
    }

    /**
     * Transform user to API response format.
     *
     * @param UserAuth $user
     * @return array
     */
    public function transformUserToArray(UserAuth $user): array
    {
        return [
            'id' => $user->user_id,
            'email' => $user->email,
            'display_name' => $user->display_name,
            'active' => $user->active,
            'suspended' => $user->suspended,
            'email_verified' => $user->email_verified_at !== null,
            'last_login' => $user->last_login?->toISOString(),
            'created_at' => $user->created_at->toISOString(),
            'updated_at' => $user->updated_at->toISOString(),
            'email_verified_at' => $user->email_verified_at?->toISOString(),
            'auth_provider' => $user->auth_provider,
            'role' => $user->role ? [
                'id' => $user->role->role_id,
                'name' => $user->role->role,
            ] : null,
            'profile' => $user->profile ? [
                'alias' => $user->profile->alias,
                'first_name' => $user->profile->first_name,
                'last_name' => $user->profile->last_name,
                'full_name' => $user->profile->full_name,
                'age_group' => $user->profile->age_group,
                'gender' => $user->profile->gender,
                'occupation' => $user->profile->occupation,
                'education_level' => $user->profile->education_level,
            ] : null,
        ];
    }

    /**
     * Get user statistics.
     *
     * @return array
     */
    public function getUserStatistics(): array
    {
        $totalUsers = UserAuth::count();
        $activeUsers = $this->userRepository->getActiveUsersCount();
        $suspendedUsers = UserAuth::where('suspended', true)->count();
        $inactiveUsers = UserAuth::where('active', false)
                                 ->where('suspended', false)
                                 ->count();

        return [
            'total' => $totalUsers,
            'active' => $activeUsers,
            'suspended' => $suspendedUsers,
            'inactive' => $inactiveUsers,
        ];
    }

    /**
     * Invalidate all sessions for a user
     */
    private function invalidateUserSessions(UserAuth $user): void
    {
        try {
            // Clear sessions from the database
            DB::table('sessions')
                ->where('user_id', $user->id)
                ->delete();

            Log::info('Sessions invalidated for user', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to invalidate user sessions', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage()
            ]);
        }
    }
}
