<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserAuth;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Attempt to authenticate a user with email and password.
     *
     * @param string $email
     * @param string $password
     * @param bool $remember
     * @return UserAuth
     * @throws AuthenticationException
     */
    public function login(string $email, string $password, bool $remember = false): UserAuth
    {
        // Find user by email first
        $user = UserAuth::where('email', $email)->first();
        
        if (!$user || !Hash::check($password, $user->password)) {
            Log::warning('Failed login attempt', [
                'email' => $email,
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
            
            throw new AuthenticationException('Invalid credentials.');
        }

        // Check if user is suspended (suspended users cannot login at all)
        if ($user->isSuspended()) {
            Log::warning('Suspended user attempted login', [
                'user_id' => $user->user_id,
                'email' => $user->email,
                'ip' => request()->ip(),
            ]);
            
            throw new AuthenticationException('Your account has been suspended. Please contact support.');
        }
        
        // If user is inactive, they have valid credentials but need reactivation
        if (!$user->active) {
            Log::info('Inactive user attempted login - needs reactivation', [
                'user_id' => $user->user_id,
                'email' => $user->email,
                'ip' => request()->ip(),
            ]);
            
            // Throw a special exception that indicates account reactivation needed
            throw new \App\Exceptions\AccountInactiveException('Your account is inactive. Please reactivate your account to continue.');
        }
        
        // For active users, use Laravel's authentication
        $credentials = [
            'email' => $email,
            'password' => $password,
        ];

        if (!Auth::attempt($credentials, $remember)) {
            Log::warning('Active user auth attempt failed unexpectedly', [
                'email' => $email,
                'ip' => request()->ip(),
            ]);
            
            throw new AuthenticationException('Authentication failed.');
        }

        // Update last login timestamp for active users
        $user->updateLastLogin();

        Log::info('Successful login', [
            'user_id' => $user->user_id,
            'email' => $user->email,
            'ip' => request()->ip(),
        ]);

        return $user;
    }    /**
     * Register a new user.
     *
     * @param array $userData
     * @return UserAuth
     * @throws ValidationException
     */
    public function register(array $userData): UserAuth
    {
        try {
            // Check if email already exists
            if (UserAuth::where('email', $userData['email'])->exists()) {
                throw ValidationException::withMessages([
                    'email' => ['The email address is already registered.']
                ]);
            }

            // Create the user
            $user = UserAuth::create([
                'email' => $userData['email'],
                'password' => Hash::make($userData['password']),
                'active' => true,
                'suspended' => false,
                'role_id' => $this->getDefaultRoleId(),
                'email_verified_at' => null, // Will be set after email verification
                'auth_provider' => 'email',
                'password_set_by_user' => true,
            ]);

            Log::info('New user registered', [
                'user_id' => $user->user_id,
                'email' => $user->email,
                'ip' => request()->ip(),
            ]);

            return $user;

        } catch (QueryException $e) {
            Log::error('Database error during user registration', [
                'email' => $userData['email'],
                'error' => $e->getMessage(),
            ]);
            
            throw ValidationException::withMessages([
                'email' => ['Unable to create account. Please try again.']
            ]);
        }
    }

    /**
     * Log out the current user.
     *
     * @return void
     */
    public function logout(): void
    {
        $user = Auth::user();
        
        if ($user) {
            Log::info('User logged out', [
                'user_id' => $user->user_id,
                'email' => $user->email,
            ]);
        }

        Auth::logout();
        
        // Invalidate the session
        request()->session()->invalidate();
        request()->session()->regenerateToken();
    }

    /**
     * Check if a user is authenticated and active.
     *
     * @return bool
     */
    public function isAuthenticated(): bool
    {
        $user = Auth::user();
        return $user && $user->active && !$user->suspended;
    }

    /**
     * Get the currently authenticated user.
     *
     * @return UserAuth|null
     */
    public function getAuthenticatedUser(): ?UserAuth
    {
        return Auth::user();
    }

    /**
     * Validate user credentials without logging in.
     *
     * @param string $email
     * @param string $password
     * @return bool
     */
    public function validateCredentials(string $email, string $password): bool
    {
        $user = UserAuth::where('email', $email)->where('active', true)->first();
        
        if (!$user) {
            return false;
        }

        return Hash::check($password, $user->password);
    }

    /**
     * Change user password.
     *
     * @param UserAuth $user
     * @param string $currentPassword
     * @param string $newPassword
     * @return bool
     * @throws ValidationException
     */
    public function changePassword(UserAuth $user, string $currentPassword, string $newPassword): bool
    {
        // Verify current password
        if (!Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.']
            ]);
        }

        // Update password
        $user->update([
            'password' => Hash::make($newPassword)
        ]);

        Log::info('Password changed', [
            'user_id' => $user->user_id,
            'email' => $user->email,
        ]);

        return true;
    }

    /**
     * Set initial password for OAuth users.
     *
     * @param UserAuth $user
     * @param string $newPassword
     * @return bool
     * @throws ValidationException
     */
    public function setInitialPassword(UserAuth $user, string $newPassword): bool
    {
        // Verify this is an OAuth user who hasn't set their password
        if (!$user->needsToSetPassword()) {
            throw ValidationException::withMessages([
                'password' => ['You have already set your password. Use the change password feature instead.']
            ]);
        }

        // Update password and mark as set by user
        $user->update([
            'password' => Hash::make($newPassword),
            'password_set_by_user' => true,
        ]);

        Log::info('Initial password set for OAuth user', [
            'user_id' => $user->user_id,
            'email' => $user->email,
            'auth_provider' => $user->auth_provider,
        ]);

        return true;
    }

    /**
     * Activate a user account.
     *
     * @param UserAuth $user
     * @return bool
     */
    public function activateUser(UserAuth $user): bool
    {
        $user->update(['active' => true]);
        
        Log::info('User account activated', [
            'user_id' => $user->user_id,
            'email' => $user->email,
        ]);

        return true;
    }

    /**
     * Deactivate a user account.
     *
     * @param UserAuth $user
     * @return bool
     */
    public function deactivateUser(UserAuth $user): bool
    {
        $user->update(['active' => false]);
        
        Log::info('User account deactivated', [
            'user_id' => $user->user_id,
            'email' => $user->email,
        ]);

        return true;
    }

    /**
     * Suspend a user account.
     *
     * @param UserAuth $user
     * @return bool
     */
    public function suspendUser(UserAuth $user): bool
    {
        $user->suspend();
        
        Log::info('User account suspended', [
            'user_id' => $user->user_id,
            'email' => $user->email,
            'suspended_by' => Auth::user()?->user_id ?? 'system',
        ]);
        
        return true;
    }
    
    /**
     * Unsuspend a user account.
     *
     * @param UserAuth $user
     * @return bool
     */
    public function unsuspendUser(UserAuth $user): bool
    {
        $user->unsuspend();
        
        Log::info('User account unsuspended', [
            'user_id' => $user->user_id,
            'email' => $user->email,
            'unsuspended_by' => Auth::user()?->user_id ?? 'system',
        ]);
        
        return true;
    }

    /**
     * Get the default role ID for new users.
     * This should be configured based on your application's needs.
     *
     * @return int|null
     */
    protected function getDefaultRoleId(): ?int
    {
        // Get the 'user' role ID from the database
        $userRole = \App\Models\Role::where('role', 'user')->first();
        return $userRole ? $userRole->role_id : null;
    }
}