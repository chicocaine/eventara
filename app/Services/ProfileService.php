<?php

namespace App\Services;

use App\Models\UserAuth;
use App\Models\UserProfile;
use App\Repositories\ProfileRepository;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ProfileService
{
    protected ProfileRepository $profileRepository;

    public function __construct(ProfileRepository $profileRepository)
    {
        $this->profileRepository = $profileRepository;
    }

    /**
     * Get user's profile.
     *
     * @param UserAuth $user
     * @return UserProfile
     * @throws \Exception
     */
    public function getUserProfile(UserAuth $user): UserProfile
    {
        $profile = $this->profileRepository->findByUserId($user->user_id);

        if (!$profile) {
            throw new \Exception('Profile not found.');
        }

        return $profile;
    }

    /**
     * Update user's profile with validation.
     *
     * @param UserAuth $user
     * @param array $data
     * @return UserProfile
     * @throws ValidationException
     * @throws \Exception
     */
    public function updateProfile(UserAuth $user, array $data): UserProfile
    {
        $profile = $this->getUserProfile($user);

        // Validate the input
        $validatedData = $this->validateProfileData($data, $profile->id);

        // Prepare update data
        $updateData = $this->prepareUpdateData($validatedData);

        // Update the profile
        if (!$this->profileRepository->update($profile, $updateData)) {
            throw new \Exception('Failed to update profile.');
        }

        // Log the update
        Log::info('Profile updated', [
            'user_id' => $user->user_id,
            'profile_id' => $profile->id,
            'changes' => array_keys($updateData),
        ]);

        // Refresh the model to get updated data
        $profile->refresh();

        return $profile;
    }

    /**
     * Validate profile data.
     *
     * @param array $data
     * @param int $profileId
     * @return array
     * @throws ValidationException
     */
    protected function validateProfileData(array $data, int $profileId): array
    {
        $validator = Validator::make($data, [
            'alias' => 'required|string|max:50|unique:users_profile,alias,' . $profileId,
            'first_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'contact_phone' => 'nullable|string|max:20',
            'age_group' => 'nullable|in:17 below,18-24,25-34,35-44,45-54,55-64,65+',
            'gender' => 'nullable|in:male,female,non-binary,prefer-not-to-say,other',
            'occupation' => 'nullable|in:student,employed,self-employed,unemployed,retired,homemaker,freelancer,entrepreneur,volunteer,other',
            'education_level' => 'nullable|in:elementary,high-school,some-college,bachelors,masters,doctorate,professional,trade-school,other',
            'bio' => 'nullable|string|max:500',
            'mailing_address' => 'nullable|string|max:500',
            'links' => 'nullable|array',
            'links.*.platform' => 'required_with:links.*|string|max:50',
            'links.*.url' => 'required_with:links.*|url|max:255',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $validator->validated();
    }

    /**
     * Prepare data for update.
     *
     * @param array $validatedData
     * @return array
     */
    protected function prepareUpdateData(array $validatedData): array
    {
        $updateData = [
            'alias' => $validatedData['alias'],
            'first_name' => $validatedData['first_name'] ?? null,
            'last_name' => $validatedData['last_name'] ?? null,
            'contact_phone' => $validatedData['contact_phone'] ?? null,
            'age_group' => $validatedData['age_group'] ?? null,
            'gender' => $validatedData['gender'] ?? null,
            'occupation' => $validatedData['occupation'] ?? null,
            'education_level' => $validatedData['education_level'] ?? null,
            'bio' => $validatedData['bio'] ?? null,
            'mailing_address' => $validatedData['mailing_address'] ?? null,
        ];

        // Handle links JSON properly
        if (isset($validatedData['links'])) {
            $links = $validatedData['links'];
            // Filter out empty links and validate structure
            $filteredLinks = array_filter($links, function($link) {
                return is_array($link) && 
                       !empty(trim($link['platform'] ?? '')) && 
                       !empty(trim($link['url'] ?? ''));
            });
            // Reindex array to remove gaps
            $updateData['links'] = empty($filteredLinks) ? null : array_values($filteredLinks);
        }

        return $updateData;
    }

    /**
     * Transform profile to API response format.
     *
     * @param UserProfile $profile
     * @return array
     */
    public function transformProfileToArray(UserProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'user_id' => $profile->user_id,
            'alias' => $profile->alias,
            'first_name' => $profile->first_name,
            'last_name' => $profile->last_name,
            'image_url' => $profile->image_url,
            'banner_url' => $profile->banner_url,
            'contact_phone' => $profile->contact_phone,
            'bio' => $profile->bio,
            'mailing_address' => $profile->mailing_address,
            'links' => $profile->links,
            'preferences' => $profile->preferences,
            'certifika_wallet' => $profile->certifika_wallet,
            'full_name' => $profile->full_name,
            'display_name' => $profile->display_name,
            'initials' => $profile->initials,
            'age_group' => $profile->age_group,
            'gender' => $profile->gender,
            'occupation' => $profile->occupation,
            'education_level' => $profile->education_level,
        ];
    }

    /**
     * Update profile preferences.
     *
     * @param UserAuth $user
     * @param array $preferences
     * @return UserProfile
     * @throws \Exception
     */
    public function updatePreferences(UserAuth $user, array $preferences): UserProfile
    {
        $profile = $this->getUserProfile($user);

        if (!$this->profileRepository->updatePreferences($profile, $preferences)) {
            throw new \Exception('Failed to update preferences.');
        }

        Log::info('Profile preferences updated', [
            'user_id' => $user->user_id,
            'profile_id' => $profile->id,
        ]);

        $profile->refresh();
        return $profile;
    }

    /**
     * Update Certifika wallet address.
     *
     * @param UserAuth $user
     * @param string $walletAddress
     * @return UserProfile
     * @throws \Exception
     */
    public function updateCertifikaWallet(UserAuth $user, string $walletAddress): UserProfile
    {
        $profile = $this->getUserProfile($user);

        if (!$this->profileRepository->update($profile, ['certifika_wallet' => $walletAddress])) {
            throw new \Exception('Failed to update Certifika wallet.');
        }

        Log::info('Certifika wallet updated', [
            'user_id' => $user->user_id,
            'profile_id' => $profile->id,
            'wallet_address' => $walletAddress,
        ]);

        $profile->refresh();
        return $profile;
    }
}
