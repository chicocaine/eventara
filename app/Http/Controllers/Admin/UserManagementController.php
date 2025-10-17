<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use App\Services\UserManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    protected AuthService $authService;
    protected UserManagementService $userManagementService;

    public function __construct(
        AuthService $authService,
        UserManagementService $userManagementService
    ) {
        $this->authService = $authService;
        $this->userManagementService = $userManagementService;
    }

    /**
     * List users with pagination, search, and filtering.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'search' => $request->get('search'),
                'role' => $request->get('role'),
                'status' => $request->get('status'),
                'age_group' => $request->get('age_group'),
                'gender' => $request->get('gender'),
                'occupation' => $request->get('occupation'),
                'education_level' => $request->get('education_level'),
                'sort_by' => $request->get('sort_by', 'created_at'),
                'sort_direction' => $request->get('sort_direction', 'desc'),
            ];

            $perPage = min($request->get('per_page', 15), 100);
            $users = $this->userManagementService->getPaginatedUsers($filters, $perPage);

            // Transform user data
            $userData = $users->map(function ($user) {
                return $this->userManagementService->transformUserToArray($user);
            });

            return response()->json([
                'success' => true,
                'data' => $userData,
                'pagination' => [
                    'current_page' => $users->currentPage(),
                    'per_page' => $users->perPage(),
                    'total' => $users->total(),
                    'last_page' => $users->lastPage(),
                    'from' => $users->firstItem(),
                    'to' => $users->lastItem(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user statistics for the dashboard.
     *
     * @return JsonResponse
     */
    public function getStats(): JsonResponse
    {
        try {
            $stats = $this->userManagementService->getUserStatistics();

            return response()->json([
                'success' => true,
                'stats' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed user by ID.
     *
     * @param int $userId
     * @return JsonResponse
     */
    public function show(int $userId): JsonResponse
    {
        try {
            $user = $this->userManagementService->getUserById($userId);

            return response()->json([
                'success' => true,
                'user' => $this->userManagementService->transformUserToArray($user)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.'
            ], 404);
        }
    }

    /**
     * Deactivate a user account.
     *
     * @param int $userId
     * @return JsonResponse
     */
    public function deactivateUser(int $userId): JsonResponse
    {
        try {
            $user = $this->userManagementService->deactivateUser($userId);

            return response()->json([
                'success' => true,
                'message' => 'User account has been deactivated.',
                'user' => [
                    'id' => $user->user_id,
                    'email' => $user->email,
                    'display_name' => $user->display_name,
                    'active' => $user->active,
                    'can_login' => $user->canLogin(),
                ]
            ]);

        } catch (\Exception $e) {
            $statusCode = str_contains($e->getMessage(), 'not found') ? 404 : 500;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $statusCode);
        }
    }

    /**
     * Activate a user account.
     *
     * @param int $userId
     * @return JsonResponse
     */
    public function activateUser(int $userId): JsonResponse
    {
        try {
            $user = $this->userManagementService->activateUser($userId);

            return response()->json([
                'success' => true,
                'message' => 'User account has been activated.',
                'user' => [
                    'id' => $user->user_id,
                    'email' => $user->email,
                    'display_name' => $user->display_name,
                    'active' => $user->active,
                    'can_login' => $user->canLogin(),
                ]
            ]);

        } catch (\Exception $e) {
            $statusCode = str_contains($e->getMessage(), 'not found') ? 404 : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $statusCode);
        }
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
            $reason = $request->input('reason');
            $user = $this->userManagementService->suspendUser($userId, $reason);

            return response()->json([
                'success' => true,
                'message' => 'User account has been suspended.',
                'user' => [
                    'id' => $user->user_id,
                    'email' => $user->email,
                    'display_name' => $user->display_name,
                    'suspended' => $user->suspended,
                    'can_login' => $user->canLogin(),
                ]
            ]);

        } catch (\Exception $e) {
            $statusCode = str_contains($e->getMessage(), 'not found') ? 404 : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $statusCode);
        }
    }

    /**
     * Unsuspend a user account.
     *
     * @param int $userId
     * @return JsonResponse
     */
    public function unsuspendUser(int $userId): JsonResponse
    {
        try {
            $user = $this->userManagementService->unsuspendUser($userId);

            return response()->json([
                'success' => true,
                'message' => 'User account has been unsuspended.',
                'user' => [
                    'id' => $user->user_id,
                    'email' => $user->email,
                    'display_name' => $user->display_name,
                    'suspended' => $user->suspended,
                    'active' => $user->active,
                    'can_login' => $user->canLogin(),
                ]
            ]);

        } catch (\Exception $e) {
            $statusCode = str_contains($e->getMessage(), 'not found') ? 404 : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $statusCode);
        }
    }

    /**
     * Update user's role.
     *
     * @param Request $request
     * @param int $userId
     * @return JsonResponse
     */
    public function updateUserRole(Request $request, int $userId): JsonResponse
    {
        try {
            $roleId = $request->input('role_id');
            $user = $this->userManagementService->updateUserRole($userId, $roleId);

            return response()->json([
                'success' => true,
                'message' => 'User role updated successfully.',
                'user' => [
                    'id' => $user->user_id,
                    'email' => $user->email,
                    'role' => $user->role?->role,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
