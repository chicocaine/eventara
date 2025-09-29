<?php

namespace App\Services;

use App\Mail\PasswordResetMail;
use App\Models\UserAuth;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PasswordResetService
{
    /**
     * Code expiration time in minutes.
     */
    const CODE_EXPIRATION_MINUTES = 30;

    /**
     * Maximum attempts allowed per user per day.
     */
    const MAX_ATTEMPTS_PER_DAY = 5;

    /**
     * Generate and send password reset code to user.
     *
     * @param UserAuth $user
     * @return array
     * @throws \Exception
     */
    public function sendResetCode(UserAuth $user): array
    {
        // Check rate limiting
        if (!$this->canSendCode($user)) {
            throw new \Exception('Too many password reset attempts. Please try again later.');
        }

        // Generate 6-digit code
        $resetCode = $this->generateCode();
        
        // Cache the code with expiration
        $cacheKey = $this->getCacheKey($user);
        $expiresAt = Carbon::now()->addMinutes(self::CODE_EXPIRATION_MINUTES);
        
        Cache::put($cacheKey, [
            'code' => $resetCode,
            'user_id' => $user->user_id,
            'created_at' => Carbon::now(),
            'expires_at' => $expiresAt,
        ], self::CODE_EXPIRATION_MINUTES * 60); // Convert to seconds

        // Track attempt for rate limiting
        $this->trackAttempt($user);

        // Send email
        try {
            Mail::to($user->email)->send(new PasswordResetMail(
                $user,
                $resetCode,
                $expiresAt->format('M d, Y \a\\t g:i A T')
            ));

            Log::info('Password reset code sent', [
                'user_id' => $user->user_id,
                'email' => $user->email,
                'expires_at' => $expiresAt,
            ]);

            return [
                'success' => true,
                'message' => 'Password reset code sent to your email address.',
                'expires_at' => $expiresAt,
            ];

        } catch (\Exception $e) {
            Log::error('Failed to send password reset email', [
                'user_id' => $user->user_id,
                'email' => $user->email,
                'error' => $e->getMessage(),
            ]);

            throw new \Exception('Failed to send password reset email. Please try again.');
        }
    }

    /**
     * Verify reset code and update password.
     *
     * @param UserAuth $user
     * @param string $code
     * @param string $newPassword
     * @return array
     * @throws \Exception
     */
    public function verifyAndResetPassword(UserAuth $user, string $code, string $newPassword): array
    {
        $cacheKey = $this->getCacheKey($user);
        $cachedData = Cache::get($cacheKey);

        if (!$cachedData) {
            throw new \Exception('Invalid or expired password reset code.');
        }

        if ($cachedData['code'] !== strtoupper(trim($code))) {
            Log::warning('Invalid password reset code attempt', [
                'user_id' => $user->user_id,
                'email' => $user->email,
                'attempted_code' => $code,
            ]);

            throw new \Exception('Invalid password reset code.');
        }

        if (Carbon::now()->isAfter($cachedData['expires_at'])) {
            Cache::forget($cacheKey);
            throw new \Exception('Password reset code has expired. Please request a new one.');
        }

        // Validate password strength (minimum 8 characters)
        if (strlen($newPassword) < 8) {
            throw new \Exception('Password must be at least 8 characters long.');
        }

        // Update the password
        $user->update([
            'password' => Hash::make($newPassword),
            'active' => true, // Ensure account is active after password reset
        ]);

        // Clear the cache
        Cache::forget($cacheKey);

        // Clear rate limiting
        $this->clearAttempts($user);

        Log::info('Password reset successfully', [
            'user_id' => $user->user_id,
            'email' => $user->email,
        ]);

        return [
            'success' => true,
            'message' => 'Your password has been reset successfully!',
            'user' => $user,
        ];
    }

    /**
     * Check if user can send another reset code (rate limiting).
     *
     * @param UserAuth $user
     * @return bool
     */
    protected function canSendCode(UserAuth $user): bool
    {
        $attemptsKey = "password_reset_attempts:{$user->user_id}:" . Carbon::now()->format('Y-m-d');
        $attempts = Cache::get($attemptsKey, 0);
        
        return $attempts < self::MAX_ATTEMPTS_PER_DAY;
    }

    /**
     * Track reset attempt for rate limiting.
     *
     * @param UserAuth $user
     */
    protected function trackAttempt(UserAuth $user): void
    {
        $attemptsKey = "password_reset_attempts:{$user->user_id}:" . Carbon::now()->format('Y-m-d');
        $attempts = Cache::get($attemptsKey, 0);
        Cache::put($attemptsKey, $attempts + 1, 86400); // 24 hours in seconds
    }

    /**
     * Clear reset attempts for user.
     *
     * @param UserAuth $user
     */
    protected function clearAttempts(UserAuth $user): void
    {
        $attemptsKey = "password_reset_attempts:{$user->user_id}:" . Carbon::now()->format('Y-m-d');
        Cache::forget($attemptsKey);
    }

    /**
     * Generate a 6-digit alphanumeric code.
     *
     * @return string
     */
    protected function generateCode(): string
    {
        // Generate a 6-digit code with letters and numbers (easier to read)
        $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (0, O, 1, I)
        $code = '';
        
        for ($i = 0; $i < 6; $i++) {
            $code .= $characters[random_int(0, strlen($characters) - 1)];
        }
        
        return $code;
    }

    /**
     * Get cache key for user password reset code.
     *
     * @param UserAuth $user
     * @return string
     */
    protected function getCacheKey(UserAuth $user): string
    {
        return "password_reset_code:{$user->user_id}";
    }

    /**
     * Get remaining attempts for user today.
     *
     * @param UserAuth $user
     * @return int
     */
    public function getRemainingAttempts(UserAuth $user): int
    {
        $attemptsKey = "password_reset_attempts:{$user->user_id}:" . Carbon::now()->format('Y-m-d');
        $attempts = Cache::get($attemptsKey, 0);
        
        return max(0, self::MAX_ATTEMPTS_PER_DAY - $attempts);
    }
}