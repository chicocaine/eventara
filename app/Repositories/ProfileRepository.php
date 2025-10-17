<?php

namespace App\Repositories;

use App\Models\UserProfile;
use Illuminate\Database\Eloquent\Collection;

class ProfileRepository extends BaseRepository
{
    public function __construct(UserProfile $model)
    {
        $this->model = $model;
    }

    /**
     * Find profile by user ID.
     *
     * @param int $userId
     * @return UserProfile|null
     */
    public function findByUserId(int $userId): ?UserProfile
    {
        return $this->model->where('user_id', $userId)->first();
    }

    /**
     * Find profile by alias.
     *
     * @param string $alias
     * @return UserProfile|null
     */
    public function findByAlias(string $alias): ?UserProfile
    {
        return $this->model->where('alias', $alias)->first();
    }

    /**
     * Check if alias is unique (excluding a specific profile ID).
     *
     * @param string $alias
     * @param int|null $excludeId
     * @return bool
     */
    public function isAliasUnique(string $alias, ?int $excludeId = null): bool
    {
        $query = $this->model->where('alias', $alias);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->doesntExist();
    }

    /**
     * Update profile links.
     *
     * @param UserProfile $profile
     * @param array|null $links
     * @return bool
     */
    public function updateLinks(UserProfile $profile, ?array $links): bool
    {
        // Filter and validate links
        if (empty($links)) {
            return $profile->update(['links' => null]);
        }

        $filteredLinks = array_filter($links, function($link) {
            return is_array($link) && 
                   !empty(trim($link['platform'] ?? '')) && 
                   !empty(trim($link['url'] ?? ''));
        });

        // Reindex array to remove gaps
        $validLinks = empty($filteredLinks) ? null : array_values($filteredLinks);

        return $profile->update(['links' => $validLinks]);
    }

    /**
     * Update profile preferences.
     *
     * @param UserProfile $profile
     * @param array $preferences
     * @return bool
     */
    public function updatePreferences(UserProfile $profile, array $preferences): bool
    {
        return $profile->update(['preferences' => $preferences]);
    }

    /**
     * Get profiles by demographic criteria.
     *
     * @param array $criteria
     * @return Collection
     */
    public function findByDemographics(array $criteria): Collection
    {
        $query = $this->model->newQuery();

        if (!empty($criteria['age_group'])) {
            $query->where('age_group', $criteria['age_group']);
        }

        if (!empty($criteria['gender'])) {
            $query->where('gender', $criteria['gender']);
        }

        if (!empty($criteria['occupation'])) {
            $query->where('occupation', $criteria['occupation']);
        }

        if (!empty($criteria['education_level'])) {
            $query->where('education_level', $criteria['education_level']);
        }

        return $query->get();
    }
}
