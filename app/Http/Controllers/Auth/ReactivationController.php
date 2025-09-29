<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\UserAuth;
use App\Services\AccountReactivationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ReactivationController extends Controller
{
    protected AccountReactivationService $reactivationService;

    public function __construct(AccountReactivationService $reactivationService)
    {
        $this->reactivationService = $reactivationService;
    }

    /**
     * Send reactivation code to user's email.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function sendCode(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users_auth,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide a valid email address.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = UserAuth::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found.',
                ], 404);
            }

            if ($user->active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account is already active.',
                ], 400);
            }

            if ($user->suspended) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account is suspended. Please contact support.',
                ], 403);
            }

            $result = $this->reactivationService->sendReactivationCode($user);

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'expires_at' => $result['expires_at'],
                'remaining_attempts' => $this->reactivationService->getRemainingAttempts($user),
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send reactivation code', [
                'email' => $request->email,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Verify reactivation code and reactivate account.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function verifyCode(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users_auth,email',
            'code' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide a valid email and 6-digit code.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = UserAuth::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found.',
                ], 404);
            }

            if ($user->active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account is already active.',
                ], 400);
            }

            if ($user->suspended) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account is suspended. Please contact support.',
                ], 403);
            }

            $result = $this->reactivationService->verifyAndReactivate($user, $request->code);

            // Log the user in after successful reactivation
            Auth::login($result['user']);

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'user' => [
                    'id' => $result['user']->user_id,
                    'email' => $result['user']->email,
                    'display_name' => $result['user']->display_name,
                    'role' => $result['user']->role?->role,
                    'active' => $result['user']->active,
                    'suspended' => $result['user']->suspended,
                    'is_volunteer' => $result['user']->isVolunteer(),
                ],
                'redirect_url' => '/dashboard',
            ]);

        } catch (\Exception $e) {
            Log::warning('Failed reactivation attempt', [
                'email' => $request->email,
                'code' => $request->code,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Check reactivation status for a user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function checkStatus(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users_auth,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide a valid email address.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = UserAuth::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found.',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'user_status' => [
                    'active' => $user->active,
                    'suspended' => $user->suspended,
                    'can_reactivate' => !$user->active && !$user->suspended,
                    'remaining_attempts' => $this->reactivationService->getRemainingAttempts($user),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to check status.',
            ], 500);
        }
    }
}
