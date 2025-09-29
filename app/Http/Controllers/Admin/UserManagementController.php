<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserAuth;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Suspend a user account.
     *
     * @param Request $request
     * @param int $userId
     * @return JsonResponse
     */
    public function suspendUser(Request $request, int $userId): JsonResponse
    {
        try {
            $user = UserAuth::findOrFail($userId);
            
            if ($user->isSuspended()) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is already suspended.'
                ], 400);
            }
            
            $this->authService->suspendUser($user);
            
            return response()->json([
                'success' => true,
                'message' => 'User has been suspended successfully.',
                'user' => [
                    'id' => $user->user_id,
                    'email' => $user->email,
                    'suspended' => $user->suspended,
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to suspend user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Unsuspend a user account.
     *
     * @param Request $request
     * @param int $userId
     * @return JsonResponse
     */
    public function unsuspendUser(Request $request, int $userId): JsonResponse
    {
        try {
            $user = UserAuth::findOrFail($userId);
            
            if (!$user->isSuspended()) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not suspended.'
                ], 400);
            }
            
            $this->authService->unsuspendUser($user);
            
            return response()->json([
                'success' => true,
                'message' => 'User has been unsuspended successfully.',
                'user' => [
                    'id' => $user->user_id,
                    'email' => $user->email,
                    'suspended' => $user->suspended,
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to unsuspend user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user status information.
     *
     * @param int $userId
     * @return JsonResponse
     */
    public function getUserStatus(int $userId): JsonResponse
    {
        try {
            $user = UserAuth::findOrFail($userId);
            
            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $user->user_id,
                    'email' => $user->email,
                    'display_name' => $user->display_name,
                    'role' => $user->role?->role,
                    'active' => $user->active,
                    'suspended' => $user->suspended,
                    'can_login' => $user->canLogin(),
                    'is_volunteer' => $user->isVolunteer(),
                    'last_login' => $user->last_login?->toISOString(),
                    'created_at' => $user->created_at->toISOString(),
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.'
            ], 404);
        }
    }
}