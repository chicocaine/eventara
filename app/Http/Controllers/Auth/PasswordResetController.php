<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\UserAuth;
use App\Services\PasswordResetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    protected PasswordResetService $passwordResetService;

    public function __construct(PasswordResetService $passwordResetService)
    {
        $this->passwordResetService = $passwordResetService;
    }

    /**
     * Send password reset code to user's email.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function sendCode(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide a valid email address.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Find user by email
            $user = UserAuth::where('email', $request->input('email'))->first();

            if (!$user) {
                // Don't reveal if email exists for security reasons
                return response()->json([
                    'success' => true,
                    'message' => 'If this email is registered with us, you will receive a password reset code shortly.',
                ]);
            }

            $result = $this->passwordResetService->sendResetCode($user);

            return response()->json($result);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Verify password reset code and reset password.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|max:255',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please check your input and try again.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Find user by email
            $user = UserAuth::where('email', $request->input('email'))->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid reset code or user not found.',
                ], 404);
            }

            $result = $this->passwordResetService->verifyAndResetPassword(
                $user,
                $request->input('code'),
                $request->input('password')
            );

            return response()->json($result);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Check the remaining attempts for password reset.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function checkStatus(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide a valid email address.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = UserAuth::where('email', $request->input('email'))->first();

            if (!$user) {
                // Don't reveal if email exists for security reasons
                return response()->json([
                    'success' => true,
                    'remaining_attempts' => 5,
                    'message' => 'Status checked successfully.',
                ]);
            }

            $remainingAttempts = $this->passwordResetService->getRemainingAttempts($user);

            return response()->json([
                'success' => true,
                'remaining_attempts' => $remainingAttempts,
                'message' => 'Status checked successfully.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to check status. Please try again.',
            ], 500);
        }
    }
}