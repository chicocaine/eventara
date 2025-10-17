<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\ProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    protected ProfileService $profileService;

    public function __construct(ProfileService $profileService)
    {
        $this->profileService = $profileService;
    }

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

        try {
            $profile = $this->profileService->getUserProfile($user);

            return response()->json([
                'success' => true,
                'profile' => $this->profileService->transformProfileToArray($profile),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);
        }
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

        try {
            $profile = $this->profileService->updateProfile($user, $request->all());

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully!',
                'profile' => $this->profileService->transformProfileToArray($profile),
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Please check your input and try again.',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
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