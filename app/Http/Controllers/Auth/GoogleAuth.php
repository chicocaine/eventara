<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\UserAuth;
use App\Models\UserProfile;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Exception;

class GoogleAuth extends Controller
{
    /**
     * Redirect to Google OAuth.
     *
     * @return RedirectResponse
     */
    public function redirectToGoogle(): RedirectResponse
    {
        Log::info('Google OAuth redirect initiated', [
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'session_id' => session()->getId(),
        ]);
        
        try {
            return Socialite::driver('google')->redirect();
        } catch (Exception $e) {
            Log::error('Google OAuth redirect failed', [
                'error' => $e->getMessage(),
                'ip' => request()->ip(),
            ]);
            return redirect('/login')->with('error', 'Failed to initiate Google authentication. Please try again.');
        }
    }

    /**
     * Handle Google OAuth callback.
     *
     * @return RedirectResponse
     */
    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            Log::info('Google OAuth callback received', [
                'query_params' => request()->query(),
                'ip' => request()->ip(),
                'session_id' => session()->getId(),
                'has_code' => request()->has('code'),
                'has_state' => request()->has('state'),
            ]);
            
            // Check for error in callback
            if (request()->has('error')) {
                Log::warning('Google OAuth error in callback', [
                    'error' => request()->get('error'),
                    'error_description' => request()->get('error_description'),
                ]);
                return redirect('/login')->with('error', 'Google authentication was cancelled or failed.');
            }
            
            // Check if we have a code parameter (required for OAuth)
            if (!request()->has('code')) {
                Log::warning('Google OAuth callback without code parameter');
                return redirect('/login')->with('error', 'Invalid Google authentication response. Please try again.');
            }
            
            $googleUser = Socialite::driver('google')->user();
            
            Log::info('Google user data retrieved', [
                'email' => $googleUser->email,
                'name' => $googleUser->name,
                'has_avatar' => !empty($googleUser->avatar),
                'user_exists_check' => UserAuth::where('email', $googleUser->email)->exists(),
            ]);
            
            // Check if user already exists
            $user = UserAuth::where('email', $googleUser->email)->first();
            
            if ($user) {
                // User exists, check if they can login
                if (!$user->canLogin()) {
                    Log::warning('Google OAuth login blocked - user cannot login', [
                        'user_id' => $user->user_id,
                        'email' => $user->email,
                        'active' => $user->active,
                        'suspended' => $user->suspended,
                    ]);
                    return redirect('/login')->with('error', 'Your account is suspended or inactive.');
                }
                
                Log::info('Attempting to login existing user', [
                    'user_id' => $user->user_id,
                    'email' => $user->email,
                    'before_login_auth_check' => Auth::check(),
                ]);
                
                Auth::login($user);
                
                Log::info('Google OAuth login successful', [
                    'user_id' => $user->user_id,
                    'email' => $user->email,
                    'after_login_auth_check' => Auth::check(),
                    'auth_user_id' => Auth::id(),
                    'session_id' => session()->getId(),
                    'ip' => request()->ip(),
                ]);
                
                return redirect('/dashboard')->with('success', 'Successfully logged in with Google!');
            } else {
                // Create new user
                Log::info('Creating new user from Google OAuth', [
                    'email' => $googleUser->email,
                    'name' => $googleUser->name,
                ]);
                
                // Use database transaction to ensure atomicity
                $user = DB::transaction(function () use ($googleUser) {
                    // Double-check user doesn't exist (race condition protection)
                    $existingUser = UserAuth::where('email', $googleUser->email)->first();
                    if ($existingUser) {
                        Log::info('User was created by another request during transaction', [
                            'email' => $googleUser->email,
                        ]);
                        return $existingUser;
                    }
                    
                    $defaultRoleId = $this->getDefaultRoleId();
                    
                    if (!$defaultRoleId) {
                        Log::error('Cannot create user: no default role found');
                        throw new Exception('No default role found');
                    }
                    
                    $user = UserAuth::create([
                        'email' => $googleUser->email,
                        'email_verified_at' => now(), // Google emails are already verified
                        'password' => Hash::make(Str::random(24)), // Random password since they use Google
                        'active' => true,
                        'suspended' => false,
                        'role_id' => $defaultRoleId,
                        'auth_provider' => 'google',
                        'password_set_by_user' => false,
                    ]);

                    // Create user profile with default preferences including email notifications
                    $profile = $this->createDefaultProfile($user, $googleUser);

                    Log::info('New user and profile created via Google OAuth', [
                        'user_id' => $user->user_id,
                        'email' => $user->email,
                        'profile_id' => $profile->id,
                        'alias' => $profile->alias,
                        'ip' => request()->ip(),
                    ]);
                    
                    return $user;
                });
                
                if (!$user) {
                    Log::error('Failed to create user via Google OAuth');
                    return redirect('/login')->with('error', 'Account creation failed. Please try again.');
                }

                Log::info('Attempting to login newly created user', [
                    'user_id' => $user->user_id,
                    'email' => $user->email,
                    'before_login_auth_check' => Auth::check(),
                ]);

                Auth::login($user);
                
                Log::info('Login attempt completed for new user', [
                    'user_id' => $user->user_id,
                    'email' => $user->email,
                    'after_login_auth_check' => Auth::check(),
                    'auth_user_id' => Auth::id(),
                    'session_id' => session()->getId(),
                ]);
                
                return redirect('/dashboard')->with('success', 'Account created and logged in successfully!');
            }
            
        } catch (Exception $e) {
            Log::error('Google OAuth error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'ip' => request()->ip(),
                'session_id' => session()->getId(),
            ]);
            
            return redirect('/login')->with('error', 'Something went wrong with Google authentication. Please try again.');
        }
    }

    /**
     * Get the default role ID for new users.
     *
     * @return int|null
     */
    protected function getDefaultRoleId(): ?int
    {
        $userRole = Role::where('role', 'user')->first();
        return $userRole ? $userRole->role_id : null;
    }

    /**
     * Create a default profile for Google OAuth users.
     *
     * @param UserAuth $user
     * @param $googleUser
     * @return UserProfile
     */
    protected function createDefaultProfile(UserAuth $user, $googleUser): UserProfile
    {
        // Generate unique alias from Google data
        $alias = $this->generateUniqueAlias($googleUser);
        
        return UserProfile::create([
            'user_id' => $user->user_id,
            'alias' => $alias,
            'first_name' => $googleUser->user['given_name'] ?? null,
            'last_name' => $googleUser->user['family_name'] ?? null,
            'image_url' => $googleUser->avatar ?? null,
            'banner_url' => null, // No default banner from Google
            'bio' => null,
            'preferences' => $this->getDefaultPreferences(),
        ]);
    }

    /**
     * Generate a unique alias from Google user data.
     *
     * @param $googleUser
     * @return string
     */
    protected function generateUniqueAlias($googleUser): string
    {
        // Try to use the name part before @ from email
        $baseAlias = explode('@', $googleUser->email)[0];
        
        // Clean the alias (remove non-alphanumeric characters)
        $baseAlias = preg_replace('/[^a-zA-Z0-9]/', '', $baseAlias);
        
        // Ensure minimum length
        if (strlen($baseAlias) < 3) {
            $baseAlias = 'user' . time();
        }
        
        $alias = $baseAlias;
        $counter = 1;
        
        // Ensure uniqueness
        while (UserProfile::where('alias', $alias)->exists()) {
            $alias = $baseAlias . $counter;
            $counter++;
        }
        
        return $alias;
    }

    /**
     * Debug method to check OAuth session state.
     */
    public function debugOAuth()
    {
        return response()->json([
            'session_id' => session()->getId(),
            'session_data' => session()->all(),
            'auth_user' => Auth::user() ? Auth::user()->email : null,
            'request_data' => request()->all(),
        ]);
    }

    /**
     * Get default preferences for new users.
     *
     * @return array
     */
    protected function getDefaultPreferences(): array
    {
        return [
            'darkmode' => false,
            'email_notifications' => [
                'event_updates' => true,
                'volunteer_opportunities' => true,
                'newsletter' => false,
                'account_security' => true,
                'marketing' => false,
            ],
        ];
    }
}
