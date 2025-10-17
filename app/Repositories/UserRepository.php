<?php

namespace App\Repositories;

use App\Models\UserAuth;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class UserRepository extends BaseRepository
{
    public function __construct(UserAuth $model)
    {
        $this->model = $model;
    }

    /**
     * Find user by email.
     *
     * @param string $email
     * @return UserAuth|null
     */
    public function findByEmail(string $email): ?UserAuth
    {
        return $this->model->where('email', $email)->first();
    }

    /**
     * Find user by ID with relations.
     *
     * @param int $userId
     * @param array $relations
     * @return UserAuth|null
     */
    public function findWithRelations(int $userId, array $relations = []): ?UserAuth
    {
        return $this->find($userId, $relations);
    }

    /**
     * Get paginated users with filters and search.
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getPaginatedUsers(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->newQuery()->with(['profile', 'role']);

        // Apply search
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function (Builder $q) use ($search) {
                $q->where('email', 'ILIKE', "%{$search}%")
                  ->orWhereHas('profile', function (Builder $profileQuery) use ($search) {
                      $profileQuery->where('first_name', 'ILIKE', "%{$search}%")
                                  ->orWhere('last_name', 'ILIKE', "%{$search}%")
                                  ->orWhere('alias', 'ILIKE', "%{$search}%");
                  });
            });
        }

        // Apply role filter
        if (!empty($filters['role']) && $filters['role'] !== 'all') {
            $query->whereHas('role', function (Builder $roleQuery) use ($filters) {
                $roleQuery->where('role', $filters['role']);
            });
        }

        // Apply status filter
        if (!empty($filters['status'])) {
            switch ($filters['status']) {
                case 'active':
                    $query->where('active', true)->where('suspended', false);
                    break;
                case 'suspended':
                    $query->where('suspended', true);
                    break;
                case 'inactive':
                    $query->where('active', false);
                    break;
            }
        }

        // Apply demographic filters
        $this->applyProfileFilters($query, $filters);

        // Apply sorting
        $this->applySorting($query, $filters);

        return $query->paginate($perPage);
    }

    /**
     * Apply profile-related filters.
     *
     * @param Builder $query
     * @param array $filters
     * @return void
     */
    private function applyProfileFilters(Builder $query, array $filters): void
    {
        $profileFilters = ['age_group', 'gender', 'occupation', 'education_level'];

        foreach ($profileFilters as $filter) {
            if (!empty($filters[$filter]) && $filters[$filter] !== 'all') {
                $query->whereHas('profile', function (Builder $profileQuery) use ($filter, $filters) {
                    $profileQuery->where($filter, $filters[$filter]);
                });
            }
        }
    }

    /**
     * Apply sorting to query.
     *
     * @param Builder $query
     * @param array $filters
     * @return void
     */
    private function applySorting(Builder $query, array $filters): void
    {
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDirection = $filters['sort_direction'] ?? 'desc';

        // Validate sort direction
        if (!in_array($sortDirection, ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }

        // Profile fields need a join
        $profileFields = ['first_name', 'last_name', 'alias', 'age_group', 'gender', 'occupation', 'education_level'];

        if (in_array($sortBy, $profileFields)) {
            $query->leftJoin('users_profile', 'users_auth.user_id', '=', 'users_profile.user_id')
                  ->orderBy("users_profile.{$sortBy}", $sortDirection)
                  ->select('users_auth.*');
        } else {
            // Direct user fields
            $userFields = ['email', 'display_name', 'created_at', 'last_login'];
            if (in_array($sortBy, $userFields)) {
                $query->orderBy($sortBy, $sortDirection);
            } else {
                // Default sorting
                $query->orderBy('created_at', 'desc');
            }
        }
    }

    /**
     * Get active users count.
     *
     * @return int
     */
    public function getActiveUsersCount(): int
    {
        return $this->model->where('active', true)
                          ->where('suspended', false)
                          ->count();
    }

    /**
     * Update user's last login timestamp.
     *
     * @param UserAuth $user
     * @return bool
     */
    public function updateLastLogin(UserAuth $user): bool
    {
        return $user->update(['last_login' => now()]);
    }
}
