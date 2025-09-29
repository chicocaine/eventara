<?php

namespace App\Services;

use App\Mail\AccountReactivationMail;
use App\Models\UserAuth;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AccountReactivationService
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
     * Generate and send reactivation code to user.
     *
     * @param UserAuth $user
     * @return array
     * @throws \Exception
     */
    public function sendReactivationCode(UserAuth $user): array
    {
        // Check rate limiting
        if (!$this->canSendCode($user)) {
            throw new \Exception('Too many reactivation attempts. Please try again later.');
        }

        // Generate 6-digit code
        $reactivationCode = $this->generateCode();
        
        // Cache the code with expiration
        $cacheKey = $this->getCacheKey($user);
        $expiresAt = Carbon::now()->addMinutes(self::CODE_EXPIRATION_MINUTES);
        
        Cache::put($cacheKey, [
            'code' => $reactivationCode,
            'user_id' => $user->user_id,
            'created_at' => Carbon::now(),
            'expires_at' => $expiresAt,
        ], self::CODE_EXPIRATION_MINUTES * 60); // Convert to seconds

        // Track attempt for rate limiting
        $this->trackAttempt($user);

        // Send email
        try {
            Mail::to($user->email)->send(new AccountReactivationMail(
                $user,
                $reactivationCode,
                $expiresAt->format('M d, Y \a\\t g:i A T')
            ));

            Log::info('Reactivation code sent', [
                'user_id' => $user->user_id,
                'email' => $user->email,
                'expires_at' => $expiresAt,
            ]);

            return [
                'success' => true,
                'message' => 'Reactivation code sent to your email address.',
                'expires_at' => $expiresAt,
            ];

        } catch (\Exception $e) {
            Log::error('Failed to send reactivation email', [
                'user_id' => $user->user_id,
                'email' => $user->email,
                'error' => $e->getMessage(),
            ]);

            throw new \Exception('Failed to send reactivation email. Please try again.');
        }
    }

    /**
     * Verify reactivation code and reactivate account.
     *
     * @param UserAuth $user
     * @param string $code
     * @return array
     * @throws \Exception
     */
    public function verifyAndReactivate(UserAuth $user, string $code): array
    {
        $cacheKey = $this->getCacheKey($user);
        $cachedData = Cache::get($cacheKey);

        if (!$cachedData) {
            throw new \Exception('Invalid or expired reactivation code.');
        }

        if ($cachedData['code'] !== strtoupper(trim($code))) {
            Log::warning('Invalid reactivation code attempt', [
                'user_id' => $user->user_id,
                'email' => $user->email,
                'attempted_code' => $code,
            ]);

            throw new \Exception('Invalid reactivation code.');
        }

        if (Carbon::now()->isAfter($cachedData['expires_at'])) {
            Cache::forget($cacheKey);
            throw new \Exception('Reactivation code has expired. Please request a new one.');
        }

        // Reactivate the account
        $user->update(['active' => true]);

        // Clear the cache
        Cache::forget($cacheKey);

        // Clear rate limiting
        $this->clearAttempts($user);

        Log::info('Account reactivated successfully', [
            'user_id' => $user->user_id,
            'email' => $user->email,
        ]);

        return [
            'success' => true,
            'message' => 'Your account has been reactivated successfully!',
            'user' => $user,
        ];
    }

    /**
     * Check if user can send another reactivation code (rate limiting).
     *
     * @param UserAuth $user
     * @return bool
     */
    protected function canSendCode(UserAuth $user): bool
    {
        $attemptsKey = "reactivation_attempts:{$user->user_id}:" . Carbon::now()->format('Y-m-d');
        $attempts = Cache::get($attemptsKey, 0);
        
        return $attempts < self::MAX_ATTEMPTS_PER_DAY;
    }

    /**
     * Track reactivation attempt for rate limiting.
     *
     * @param UserAuth $user
     */
    protected function trackAttempt(UserAuth $user): void
    {
        $attemptsKey = "reactivation_attempts:{$user->user_id}:" . Carbon::now()->format('Y-m-d');
        $attempts = Cache::get($attemptsKey, 0);
        Cache::put($attemptsKey, $attempts + 1, 86400); // 24 hours in seconds
    }

    /**
     * Clear reactivation attempts for user.
     *
     * @param UserAuth $user
     */
    protected function clearAttempts(UserAuth $user): void
    {
        $attemptsKey = "reactivation_attempts:{$user->user_id}:" . Carbon::now()->format('Y-m-d');
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
     * Get cache key for user reactivation code.
     *
     * @param UserAuth $user
     * @return string
     */
    protected function getCacheKey(UserAuth $user): string
    {
        return "reactivation_code:{$user->user_id}";
    }

    /**
     * Get remaining attempts for user today.
     *
     * @param UserAuth $user
     * @return int
     */
    public function getRemainingAttempts(UserAuth $user): int
    {
        $attemptsKey = "reactivation_attempts:{$user->user_id}:" . Carbon::now()->format('Y-m-d');
        $attempts = Cache::get($attemptsKey, 0);
        
        return max(0, self::MAX_ATTEMPTS_PER_DAY - $attempts);
    }
}