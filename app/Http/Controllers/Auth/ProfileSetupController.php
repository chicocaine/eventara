<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\UserAuth;
use App\Models\UserProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ProfileSetupController extends Controller
{
    /**
     * Setup user profile after registration.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function setupProfile(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }

        // Check if profile already exists
        if ($user->profile) {
            return response()->json([
                'success' => false,
                'message' => 'Profile already exists.',
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'alias' => 'required|string|max:50|unique:users_profile,alias',
            'first_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'image_url' => 'nullable|url|max:500',
            'banner_url' => 'nullable|url|max:500',
            'contact_phone' => 'nullable|string|max:20',
            'age_group' => 'nullable|in:17 below,18-24,25-34,35-44,45-54,55-64,65+',
            'gender' => 'nullable|in:male,female,non-binary,prefer-not-to-say,other',
            'occupation' => 'nullable|in:student,employed,self-employed,unemployed,retired,homemaker,freelancer,entrepreneur,volunteer,other',
            'education_level' => 'nullable|in:elementary,high-school,some-college,bachelors,masters,doctorate,professional,trade-school,other',
            'bio' => 'nullable|string|max:1000',
            'preferences' => 'nullable|array',
            'preferences.darkmode' => 'nullable|boolean',
            'preferences.email_notifications' => 'nullable|array',
            'preferences.email_notifications.event_updates' => 'nullable|boolean',
            'preferences.email_notifications.volunteer_opportunities' => 'nullable|boolean',
            'preferences.email_notifications.newsletter' => 'nullable|boolean',
            'preferences.email_notifications.account_security' => 'nullable|boolean',
            'preferences.email_notifications.marketing' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please check your input and try again.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $profileData = [
                'user_id' => $user->user_id,
                'alias' => $request->input('alias'),
                'first_name' => $request->input('first_name'),
                'last_name' => $request->input('last_name'),
                'image_url' => $request->input('image_url') ?: $this->getDefaultImageUrl(),
                'banner_url' => $request->input('banner_url') ?: $this->getDefaultBannerUrl(),
                'contact_phone' => $request->input('contact_phone'),
                'age_group' => $request->input('age_group'),
                'gender' => $request->input('gender'),
                'occupation' => $request->input('occupation'),
                'education_level' => $request->input('education_level'),
                'bio' => $request->input('bio'),
                'mailing_address' => $request->input('mailing_address'),
                'links' => $request->input('links'),
                'preferences' => $request->input('preferences') ?: $this->getDefaultPreferences(),
            ];

            $profile = UserProfile::create($profileData);

            Log::info('Profile setup completed', [
                'user_id' => $user->user_id,
                'alias' => $profile->alias,
            ]);

            // Reload user with relationships to ensure we have complete data
            $userWithPermissions = \App\Models\UserAuth::with('role.permissions')->find($user->user_id);
            
            // Extract permissions
            $permissions = $userWithPermissions->role && $userWithPermissions->role->permissions 
                ? $userWithPermissions->role->permissions->pluck('permission')->toArray()
                : [];

            return response()->json([
                'success' => true,
                'message' => 'Profile setup completed successfully!',
                'user' => [
                    'id' => $user->user_id,
                    'email' => $user->email,
                    'display_name' => $profile->display_name,
                    'role' => $user->role?->role,
                    'permissions' => $permissions,
                    'active' => $user->active,
                    'suspended' => $user->suspended,
                    'is_volunteer' => $user->is_volunteer,
                ],
                'profile' => [
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
                    'full_name' => $profile->full_name,
                    'display_name' => $profile->display_name,
                    'initials' => $profile->initials,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Profile setup failed', [
                'user_id' => $user->user_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to setup profile. Please try again.',
            ], 500);
        }
    }

    /**
     * Upload profile image or banner.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048', // 2MB max
            'type' => 'required|in:profile,banner',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please check your file and try again.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $file = $request->file('file');
            $type = $request->input('type');
            
            // Generate unique filename
            $timestamp = now()->format('Y-m-d_H-i-s');
            $extension = $file->getClientOriginalExtension();
            $filename = "profile_{$type}_{$user->user_id}_{$timestamp}.{$extension}";
            
            // Store in public disk under profile_images directory
            $path = $file->storeAs('profile_images', $filename, 'public');
            
            if (!$path) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload file.',
                ], 500);
            }

            // Generate public URL
            $url = asset('storage/' . $path);

            Log::info('Profile image uploaded', [
                'user_id' => $user->user_id,
                'type' => $type,
                'filename' => $filename,
                'url' => $url,
            ]);

            return response()->json([
                'success' => true,
                'message' => ucfirst($type) . ' image uploaded successfully!',
                'data' => [
                    'url' => $url,
                    'filename' => $filename,
                    'type' => $type,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Profile image upload failed', [
                'user_id' => $user->user_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload image. Please try again.',
            ], 500);
        }
    }

    /**
     * Skip profile setup and create default profile.
     *
     * @return JsonResponse
     */
    public function skipProfileSetup(): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }

        // Check if profile already exists
        if ($user->profile) {
            return response()->json([
                'success' => false,
                'message' => 'Profile already exists.',
            ], 400);
        }

        try {
            // Create default profile
            $defaultAlias = $this->getDefaultAlias($user->email);
            
            $profileData = [
                'user_id' => $user->user_id,
                'alias' => $defaultAlias,
                'first_name' => null,
                'last_name' => null,
                'image_url' => $this->getDefaultImageUrl(),
                'banner_url' => $this->getDefaultBannerUrl(),
                'contact_phone' => null,
                'age_group' => null,
                'gender' => null,
                'occupation' => null,
                'education_level' => null,
                'bio' => null,
                'mailing_address' => null,
                'links' => null,
                'preferences' => $this->getDefaultPreferences(),
            ];

            $profile = UserProfile::create($profileData);

            Log::info('Profile setup skipped - default profile created', [
                'user_id' => $user->user_id,
                'alias' => $profile->alias,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Welcome to Eventara! You can update your profile anytime.',
                'user' => [
                    'id' => $user->user_id,
                    'email' => $user->email,
                    'display_name' => $profile->display_name,
                    'role' => $user->role?->role,
                    'active' => $user->active,
                ],
                'profile' => [
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
                    'full_name' => $profile->full_name,
                    'display_name' => $profile->display_name,
                    'initials' => $profile->initials,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Skip profile setup failed', [
                'user_id' => $user->user_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to setup default profile. Please try again.',
            ], 500);
        }
    }

    /**
     * Get default alias from email.
     *
     * @param string $email
     * @return string
     */
    private function getDefaultAlias(string $email): string
    {
        $baseAlias = explode('@', $email)[0];
        
        // Check if alias already exists and add number if needed
        $alias = $baseAlias;
        $counter = 1;
        
        while (UserProfile::where('alias', $alias)->exists()) {
            $alias = $baseAlias . $counter;
            $counter++;
        }
        
        return $alias;
    }

    /**
     * Get default image URL.
     *
     * @return string
     */
    private function getDefaultImageUrl(): string
    {
        // You can replace this with your default avatar service
        return 'https://ui-avatars.com/api/?size=200&background=4f46e5&color=ffffff&name=User';
    }

    /**
     * Get default banner URL.
     *
     * @return string|null
     */
    private function getDefaultBannerUrl(): ?string
    {
        // Return null for default banner - no default banner needed
        return null;
    }

    /**
     * Get default preferences.
     *
     * @return array
     */
    private function getDefaultPreferences(): array
    {
        return [
            'darkmode' => false,
            'email_notifications' => [
                'event_updates' => true,
                'volunteer_opportunities' => true,
                'newsletter' => false,
                'account_security' => true,
                'marketing' => false,
            ],
        ];
    }
}