<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\SetInitialPasswordRequest;
use App\Services\AuthService;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Handle login request.
     *
     * @param LoginRequest $request
     * @return JsonResponse|RedirectResponse
     */
    public function login(LoginRequest $request): JsonResponse|RedirectResponse
    {
        try {
            $user = $this->authService->login(
                $request->input('email'),
                $request->input('password'),
                $request->boolean('remember', false)
            );

            if ($request->expectsJson()) {
                // Get user permissions
                $permissions = [];
                if ($user->role && $user->role->permissions) {
                    $permissions = $user->role->permissions->pluck('permission')->toArray();
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Login successful',
                    'user' => [
                        'id' => $user->user_id,
                        'email' => $user->email,
                        'display_name' => $user->display_name,
                        'role' => $user->role?->role,
                        'permissions' => $permissions,
                        'active' => $user->active,
                        'suspended' => $user->suspended,
                        'is_volunteer' => $user->isVolunteer(),
                        'auth_provider' => $user->auth_provider,
                        'password_set_by_user' => $user->password_set_by_user,
                    ],
                    'redirect_url' => $this->getIntendedUrl()
                ]);
            }

            return redirect()->intended('/dashboard');

        } catch (\App\Exceptions\AccountInactiveException $e) {
            // Handle inactive account - redirect to reactivation
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'needs_reactivation' => true,
                    'redirect_url' => '/reactivate',
                    'email' => $request->input('email'),
                ], 403);
            }

            return redirect('/reactivate')
                ->with('email', $request->input('email'))
                ->with('message', $e->getMessage());

        } catch (AuthenticationException $e) {
            return $this->handleAuthError($request, $e->getMessage());
        }
    }

    /**
     * Handle registration request.
     *
     * @param RegisterRequest $request
     * @return JsonResponse|RedirectResponse
     */
    public function register(RegisterRequest $request): JsonResponse|RedirectResponse
    {
        try {
            $user = $this->authService->register($request->validated());

            // Auto-login after registration
            $this->authService->login($user->email, $request->input('password'));

            // Check if user needs to complete profile setup
            $redirectUrl = $user->hasCompletedProfileSetup() ? '/dashboard' : '/profile-setup';

            if ($request->expectsJson()) {
                // Get user permissions
                $permissions = [];
                if ($user->role && $user->role->permissions) {
                    $permissions = $user->role->permissions->pluck('permission')->toArray();
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Registration successful',
                    'user' => [
                        'id' => $user->user_id,
                        'email' => $user->email,
                        'display_name' => $user->display_name,
                        'role' => $user->role?->role,
                        'permissions' => $permissions,
                        'active' => $user->active,
                        'suspended' => $user->suspended,
                        'is_volunteer' => $user->isVolunteer(),
                    ],
                    'redirect_url' => $redirectUrl
                ], 201);
            }

            $message = $redirectUrl === '/profile-setup' 
                ? 'Registration successful! Please complete your profile setup.'
                : 'Registration successful! Welcome to Eventara.';

            return redirect($redirectUrl)->with('success', $message);

        } catch (ValidationException $e) {
            return $this->handleValidationErrors($request, $e->errors());
        }
    }

    /**
     * Handle logout request.
     *
     * @param Request $request
     * @return JsonResponse|RedirectResponse
     */
    public function logout(Request $request): JsonResponse|RedirectResponse
    {
        $this->authService->logout();

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully',
                'redirect_url' => '/login'
            ]);
        }

        return redirect('/login')->with('success', 'You have been logged out successfully.');
    }

    /**
     * Check authentication status (API endpoint).
     *
     * @return JsonResponse
     */
    public function checkAuth(): JsonResponse
    {
        if (!$this->authService->isAuthenticated()) {
            return response()->json([
                'authenticated' => false,
            ]);
        }

        $user = $this->authService->getAuthenticatedUser();

        // Get user permissions
        $permissions = [];
        if ($user->role && $user->role->permissions) {
            $permissions = $user->role->permissions->pluck('permission')->toArray();
        }

        return response()->json([
            'authenticated' => true,
            'user' => [
                'id' => $user->user_id,
                'email' => $user->email,
                'display_name' => $user->display_name,
                'role' => $user->role?->role,
                'permissions' => $permissions,
                'active' => $user->active,
                'suspended' => $user->suspended,
                'is_volunteer' => $user->isVolunteer(),
                'auth_provider' => $user->auth_provider,
                'password_set_by_user' => $user->password_set_by_user,
            ],
        ]);
    }

    /**
     * Change password.
     *
     * @param ChangePasswordRequest $request
     * @return JsonResponse|RedirectResponse
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse|RedirectResponse
    {
        try {
            $user = $this->authService->getAuthenticatedUser();
            
            $this->authService->changePassword(
                $user,
                $request->input('current_password'),
                $request->input('password')
            );

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Password changed successfully',
                ]);
            }

            return back()->with('success', 'Password changed successfully.');

        } catch (ValidationException $e) {
            return $this->handleValidationErrors($request, $e->errors());
        }
    }

    /**
     * Set initial password for OAuth users.
     *
     * @param SetInitialPasswordRequest $request
     * @return JsonResponse|RedirectResponse
     */
    public function setInitialPassword(SetInitialPasswordRequest $request): JsonResponse|RedirectResponse
    {
        try {
            $user = $this->authService->getAuthenticatedUser();
            
            // Double-check that user needs to set password
            if (!$user->needsToSetPassword()) {
                throw ValidationException::withMessages([
                    'password' => ['You have already set your password. Use the change password feature instead.']
                ]);
            }
            
            $this->authService->setInitialPassword(
                $user,
                $request->input('password')
            );

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Password set successfully. You can now log in using your email and password.',
                ]);
            }

            return back()->with('success', 'Password set successfully. You can now log in using your email and password.');

        } catch (ValidationException $e) {
            return $this->handleValidationErrors($request, $e->errors());
        }
    }

    /**
     * Handle validation errors for both JSON and web requests.
     *
     * @param Request $request
     * @param array $errors
     * @return JsonResponse|RedirectResponse
     */
    protected function handleValidationErrors(Request $request, array $errors): JsonResponse|RedirectResponse
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $errors,
            ], 422);
        }

        return back()->withErrors($errors)->withInput($request->except('password', 'password_confirmation'));
    }

    /**
     * Handle authentication errors for both JSON and web requests.
     *
     * @param Request $request
     * @param string $message
     * @return JsonResponse|RedirectResponse
     */
    protected function handleAuthError(Request $request, string $message): JsonResponse|RedirectResponse
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => $message,
            ], 401);
        }

        return back()->withErrors(['email' => $message])->withInput($request->only('email'));
    }

    /**
     * Get the intended URL after authentication.
     *
     * @return string
     */
    protected function getIntendedUrl(): string
    {
        return session()->pull('url.intended', '/dashboard');
    }
}