<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\UserAuth;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /**
     * Get user settings.
     */
    public function getSettings(): JsonResponse
    {
        /** @var UserAuth|null $user */
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        // Get user profile to access preferences
        $profile = $user->profile;
        $preferences = $profile ? $profile->preferences : [];

        // Default settings structure
        $settings = [
            'dark_mode' => $preferences['darkmode'] ?? false,
            'notifications' => [
                'email_notifications' => $preferences['email_notifications']['account_security'] ?? true,
                'push_notifications' => false,
                'event_reminders' => $preferences['email_notifications']['event_updates'] ?? true,
                'venue_updates' => $preferences['email_notifications']['volunteer_opportunities'] ?? false,
                'security_alerts' => $preferences['email_notifications']['account_security'] ?? true,
            ],
            'privacy' => [
                'profile_visibility' => 'friends',
                'show_online_status' => false,
                'allow_friend_requests' => true,
                'show_activity_status' => false,
                'data_collection_consent' => false,
                'marketing_emails_consent' => $preferences['email_notifications']['marketing'] ?? false,
            ]
        ];

        return response()->json([
            'success' => true,
            'settings' => $settings
        ]);
    }

    /**
     * Update user settings.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        /** @var UserAuth|null $user */
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $settings = $request->all();
        
        // Update user profile preferences
        $profile = $user->profile;
        if ($profile) {
            $currentPreferences = $profile->preferences ?? [];
            
            // Map settings to preferences structure
            $newPreferences = [
                'darkmode' => $settings['dark_mode'] ?? false,
                'email_notifications' => [
                    'event_updates' => $settings['notifications']['event_reminders'] ?? true,
                    'volunteer_opportunities' => $settings['notifications']['venue_updates'] ?? false,
                    'newsletter' => false,
                    'account_security' => $settings['notifications']['security_alerts'] ?? true,
                    'marketing' => $settings['privacy']['marketing_emails_consent'] ?? false,
                ]
            ];
            
            $profile->update(['preferences' => $newPreferences]);
        }

        Log::info('User settings updated', [
            'user_id' => $user->user_id,
            'email' => $user->email,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully'
        ]);
    }

    /**
     * Deactivate user account.
     */
    public function deactivateAccount(Request $request): JsonResponse
    {
        /** @var UserAuth|null $user */
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $request->validate([
            'confirmation' => 'required|string'
        ]);

        $expectedConfirmation = 'deactivate-' . explode('@', $user->email)[0];
        
        if ($request->confirmation !== $expectedConfirmation) {
            throw ValidationException::withMessages([
                'confirmation' => ['Confirmation text does not match.']
            ]);
        }

        // Deactivate the user
        $user->update(['active' => false]);

        Log::info('User account deactivated', [
            'user_id' => $user->user_id,
            'email' => $user->email,
        ]);

        // Logout the user
        Auth::logout();

        return response()->json([
            'success' => true,
            'message' => 'Account deactivated successfully'
        ]);
    }

    /**
     * Delete user account permanently.
     */
    public function deleteAccount(Request $request): JsonResponse
    {
        /** @var UserAuth|null $user */
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $request->validate([
            'confirmation' => 'required|string'
        ]);

        $expectedConfirmation = 'delete-' . explode('@', $user->email)[0];
        
        if ($request->confirmation !== $expectedConfirmation) {
            throw ValidationException::withMessages([
                'confirmation' => ['Confirmation text does not match.']
            ]);
        }

        Log::info('User account deletion initiated', [
            'user_id' => $user->user_id,
            'email' => $user->email,
        ]);

        // Delete the user (this will cascade delete related records)
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Account deleted successfully'
        ]);
    }
}
