<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\UserAuth;
use App\Models\UserProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    /**
     * Get user's profile.
     *
     * @return JsonResponse
     */
    public function getProfile(): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }

        $profile = $user->profile;
        
        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Profile not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
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
                'certifika_wallet' => $profile->certifika_wallet,
                'full_name' => $profile->full_name,
                'display_name' => $profile->display_name,
                'initials' => $profile->initials,
                'age_group' => $profile->age_group,
                'gender' => $profile->gender,
                'occupation' => $profile->occupation,
                'education_level' => $profile->education_level,
            ],
        ]);
    }

    /**
     * Update user's profile.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }

        $profile = $user->profile;
        
        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Profile not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'alias' => 'required|string|max:50|unique:users_profile,alias,' . $profile->id,
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
            return response()->json([
                'success' => false,
                'message' => 'Please check your input and try again.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $updateData = [
                'alias' => $request->input('alias'),
                'first_name' => $request->input('first_name'),
                'last_name' => $request->input('last_name'),
                'contact_phone' => $request->input('contact_phone'),
                'age_group' => $request->input('age_group'),
                'gender' => $request->input('gender'),
                'occupation' => $request->input('occupation'),
                'education_level' => $request->input('education_level'),
                'bio' => $request->input('bio'),
                'mailing_address' => $request->input('mailing_address'),
            ];

            // Handle links JSON properly
            if ($request->has('links')) {
                $links = $request->input('links');
                // Filter out empty links and validate structure
                $filteredLinks = array_filter($links, function($link) {
                    return is_array($link) && 
                           !empty(trim($link['platform'] ?? '')) && 
                           !empty(trim($link['url'] ?? ''));
                });
                // Reindex array to remove gaps
                $updateData['links'] = empty($filteredLinks) ? null : array_values($filteredLinks);
            }

            $profile->update($updateData);

            Log::info('Profile updated', [
                'user_id' => $user->user_id,
                'profile_id' => $profile->id,
                'changes' => $request->only(['alias', 'first_name', 'last_name', 'contact_phone', 'age_group', 'gender', 'occupation', 'education_level', 'bio', 'mailing_address', 'links']),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully!',
                'profile' => [
                    'id' => $profile->id,
                    'user_id' => $profile->user_id,
                    'alias' => $profile->alias,
                    'first_name' => $profile->first_name,
                    'last_name' => $profile->last_name,
                    'image_url' => $profile->image_url,
                    'banner_url' => $profile->banner_url,
                    'contact_phone' => $profile->contact_phone,
                    'age_group' => $profile->age_group,
                    'gender' => $profile->gender,
                    'occupation' => $profile->occupation,
                    'education_level' => $profile->education_level,
                    'bio' => $profile->bio,
                    'mailing_address' => $profile->mailing_address,
                    'links' => $profile->links,
                    'preferences' => $profile->preferences,
                    'certifika_wallet' => $profile->certifika_wallet,
                    'full_name' => $profile->full_name,
                    'display_name' => $profile->display_name,
                    'initials' => $profile->initials,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Profile update failed', [
                'user_id' => $user->user_id,
                'profile_id' => $profile->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile. Please try again.',
            ], 500);
        }
    }

    /**
     * Upload profile image or banner.
     * (This method already exists in ProfileSetupController, but we'll reuse it)
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
            'file' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:4096', // 2MB max
            'type' => 'required|in:profile,banner',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please check your file size (max: 4mb) or file type and try again.',
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

            // Update profile with new image URL
            $profile = $user->profile;
            if ($profile) {
                $updateField = $type === 'profile' ? 'image_url' : 'banner_url';
                $profile->update([$updateField => $url]);
            }

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
}