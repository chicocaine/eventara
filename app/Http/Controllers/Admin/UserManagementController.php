<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserAuth;
use App\Models\Role;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class UserManagementController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
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
            $query = UserAuth::with(['profile', 'role']);

            // Search by name or email
            if ($search = $request->get('search')) {
                $query->where(function (Builder $q) use ($search) {
                    $q->where('email', 'ILIKE', "%{$search}%")
                      ->orWhereHas('profile', function (Builder $profileQuery) use ($search) {
                          $profileQuery->where('first_name', 'ILIKE', "%{$search}%")
                                      ->orWhere('last_name', 'ILIKE', "%{$search}%")
                                      ->orWhere('alias', 'ILIKE', "%{$search}%");
                      });
                });
            }

            // Filter by role
            if ($roleFilter = $request->get('role')) {
                if ($roleFilter !== 'all') {
                    $query->whereHas('role', function (Builder $roleQuery) use ($roleFilter) {
                        $roleQuery->where('role', $roleFilter);
                    });
                }
            }

            // Filter by status
            if ($statusFilter = $request->get('status')) {
                switch ($statusFilter) {
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

            // Filter by age group
            if ($ageGroupFilter = $request->get('age_group')) {
                if ($ageGroupFilter !== 'all') {
                    $query->whereHas('profile', function (Builder $profileQuery) use ($ageGroupFilter) {
                        $profileQuery->where('age_group', $ageGroupFilter);
                    });
                }
            }

            // Filter by gender
            if ($genderFilter = $request->get('gender')) {
                if ($genderFilter !== 'all') {
                    $query->whereHas('profile', function (Builder $profileQuery) use ($genderFilter) {
                        $profileQuery->where('gender', $genderFilter);
                    });
                }
            }

            // Filter by occupation
            if ($occupationFilter = $request->get('occupation')) {
                if ($occupationFilter !== 'all') {
                    $query->whereHas('profile', function (Builder $profileQuery) use ($occupationFilter) {
                        $profileQuery->where('occupation', $occupationFilter);
                    });
                }
            }

            // Filter by education level
            if ($educationFilter = $request->get('education_level')) {
                if ($educationFilter !== 'all') {
                    $query->whereHas('profile', function (Builder $profileQuery) use ($educationFilter) {
                        $profileQuery->where('education_level', $educationFilter);
                    });
                }
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortDirection = $request->get('sort_direction', 'desc');
            
            // Validate sort direction
            $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'desc';
            
            // Apply sorting based on field
            switch ($sortBy) {
                case 'email':
                case 'created_at':
                case 'last_login':
                case 'active':
                case 'suspended':
                    $query->orderBy($sortBy, $sortDirection);
                    break;
                case 'role':
                    $query->leftJoin('roles', 'users_auth.role_id', '=', 'roles.role_id')
                          ->orderBy('roles.role', $sortDirection)
                          ->select('users_auth.*');
                    break;
                case 'first_name':
                case 'last_name':
                case 'alias':
                case 'age_group':
                case 'gender':
                case 'occupation':
                case 'education_level':
                    $query->leftJoin('users_profile', 'users_auth.user_id', '=', 'users_profile.user_id')
                          ->orderBy("users_profile.{$sortBy}", $sortDirection)
                          ->select('users_auth.*');
                    break;
                default:
                    // Default to creation date if invalid sort field
                    $query->orderBy('created_at', 'desc');
            }

            // Paginate results
            $perPage = min($request->get('per_page', 15), 100); // Max 100 per page
            $users = $query->paginate($perPage);

            // Transform user data
            $userData = $users->map(function ($user) {
                return [
                    'id' => $user->user_id,
                    'email' => $user->email,
                    'display_name' => $user->display_name,
                    'first_name' => $user->profile?->first_name,
                    'last_name' => $user->profile?->last_name,
                    'alias' => $user->profile?->alias,
                    'role' => $user->role?->role,
                    'active' => $user->active,
                    'suspended' => $user->suspended,
                    'can_login' => $user->canLogin(),
                    'is_volunteer' => $user->isVolunteer(),
                    'last_login' => $user->last_login?->toISOString(),
                    'created_at' => $user->created_at->toISOString(),
                    'auth_provider' => $user->auth_provider,
                    // Demographics
                    'age_group' => $user->profile?->age_group,
                    'gender' => $user->profile?->gender,
                    'occupation' => $user->profile?->occupation,
                    'education_level' => $user->profile?->education_level,
                ];
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
            // Total users
            $totalUsers = UserAuth::count();

            // Active users (active and not suspended)
            $activeUsers = UserAuth::where('active', true)
                                  ->where('suspended', false)
                                  ->count();

            // Suspended users
            $suspendedUsers = UserAuth::where('suspended', true)->count();

            // New users this week
            $newThisWeek = UserAuth::where('created_at', '>=', now()->subWeek())->count();

            // Inactive users (not active)
            $inactiveUsers = UserAuth::where('active', false)->count();

            // Users by role
            $usersByRole = UserAuth::with('role')
                                  ->get()
                                  ->groupBy(function ($user) {
                                      return $user->role?->role ?? 'no_role';
                                  })
                                  ->map(function ($users) {
                                      return $users->count();
                                  });

            // Recent activity stats
            $lastLoginStats = [
                'last_24h' => UserAuth::where('last_login', '>=', now()->subDay())->count(),
                'last_week' => UserAuth::where('last_login', '>=', now()->subWeek())->count(),
                'last_month' => UserAuth::where('last_login', '>=', now()->subMonth())->count(),
            ];

            // Demographic statistics
            $ageGroupStats = UserAuth::with('profile')
                                    ->get()
                                    ->groupBy(function ($user) {
                                        return $user->profile?->age_group ?? 'not_specified';
                                    })
                                    ->map(function ($users) {
                                        return $users->count();
                                    });

            $genderStats = UserAuth::with('profile')
                                  ->get()
                                  ->groupBy(function ($user) {
                                      return $user->profile?->gender ?? 'not_specified';
                                  })
                                  ->map(function ($users) {
                                      return $users->count();
                                  });

            $occupationStats = UserAuth::with('profile')
                                      ->get()
                                      ->groupBy(function ($user) {
                                          return $user->profile?->occupation ?? 'not_specified';
                                      })
                                      ->map(function ($users) {
                                          return $users->count();
                                      });

            $educationStats = UserAuth::with('profile')
                                     ->get()
                                     ->groupBy(function ($user) {
                                         return $user->profile?->education_level ?? 'not_specified';
                                     })
                                     ->map(function ($users) {
                                         return $users->count();
                                     });

            return response()->json([
                'success' => true,
                'stats' => [
                    'total_users' => $totalUsers,
                    'active_users' => $activeUsers,
                    'suspended_users' => $suspendedUsers,
                    'inactive_users' => $inactiveUsers,
                    'new_this_week' => $newThisWeek,
                    'users_by_role' => $usersByRole,
                    'login_activity' => $lastLoginStats,
                    'demographics' => [
                        'age_groups' => $ageGroupStats,
                        'genders' => $genderStats,
                        'occupations' => $occupationStats,
                        'education_levels' => $educationStats,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a user's role.
     *
     * @param Request $request
     * @param int $userId
     * @return JsonResponse
     */
    public function updateUserRole(Request $request, int $userId): JsonResponse
    {
        try {
            $request->validate([
                'role' => 'required|string|in:user,volunteer,admin'
            ]);

            $user = UserAuth::findOrFail($userId);
            $newRole = Role::where('role', $request->role)->firstOrFail();

            // Prevent users from removing their own admin access
            $currentUser = Auth::user();
            if ($currentUser && $currentUser->user_id === $userId && $user->role?->role === 'admin' && $request->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot remove your own admin privileges.'
                ], 400);
            }

            $oldRole = $user->role?->role;
            $user->update(['role_id' => $newRole->role_id]);

            return response()->json([
                'success' => true,
                'message' => "User role updated from '{$oldRole}' to '{$newRole->role}' successfully.",
                'user' => [
                    'id' => $user->user_id,
                    'email' => $user->email,
                    'display_name' => $user->display_name,
                    'old_role' => $oldRole,
                    'new_role' => $newRole->role,
                ]
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User or role not found.'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid role specified.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user role: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Deactivate a user account.
     *
     * @param Request $request
     * @param int $userId
     * @return JsonResponse
     */
    public function deactivateUser(Request $request, int $userId): JsonResponse
    {
        try {
            $user = UserAuth::findOrFail($userId);
            
            // Prevent users from deactivating their own account
            $currentUser = Auth::user();
            if ($currentUser && $currentUser->user_id === $userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot deactivate your own account.'
                ], 400);
            }
            
            if (!$user->active) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is already deactivated.'
                ], 400);
            }
            
            $user->update(['active' => false]);
            
            return response()->json([
                'success' => true,
                'message' => 'User has been deactivated successfully.',
                'user' => [
                    'id' => $user->user_id,
                    'email' => $user->email,
                    'display_name' => $user->display_name,
                    'active' => $user->active,
                    'can_login' => $user->canLogin(),
                ]
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to deactivate user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Activate a user account.
     *
     * @param Request $request
     * @param int $userId
     * @return JsonResponse
     */
    public function activateUser(Request $request, int $userId): JsonResponse
    {
        try {
            $user = UserAuth::findOrFail($userId);
            
            if ($user->active) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is already active.'
                ], 400);
            }
            
            $user->update(['active' => true]);
            
            return response()->json([
                'success' => true,
                'message' => 'User has been activated successfully.',
                'user' => [
                    'id' => $user->user_id,
                    'email' => $user->email,
                    'display_name' => $user->display_name,
                    'active' => $user->active,
                    'can_login' => $user->canLogin(),
                ]
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to activate user: ' . $e->getMessage()
            ], 500);
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
            $user = UserAuth::with(['profile', 'role'])->findOrFail($userId);
            
            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $user->user_id,
                    'email' => $user->email,
                    'display_name' => $user->display_name,
                    'first_name' => $user->profile?->first_name,
                    'last_name' => $user->profile?->last_name,
                    'phone' => $user->profile?->phone,
                    'alias' => $user->profile?->alias,
                    'role' => $user->role?->role,
                    'active' => $user->active,
                    'suspended' => $user->suspended,
                    'can_login' => $user->canLogin(),
                    'is_volunteer' => $user->isVolunteer(),
                    'last_login' => $user->last_login?->toISOString(),
                    'created_at' => $user->created_at->toISOString(),
                    'updated_at' => $user->updated_at->toISOString(),
                    'email_verified_at' => $user->email_verified_at?->toISOString(),
                    'auth_provider' => $user->auth_provider,
                    // Demographics from profile
                    'age_group' => $user->profile?->age_group,
                    'gender' => $user->profile?->gender,
                    'occupation' => $user->profile?->occupation,
                    'education_level' => $user->profile?->education_level,
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