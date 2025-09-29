<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserAuth;
use App\Models\UserProfile;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle Google OAuth callback.
     *
     * @return RedirectResponse
     */
    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
            
            // Check if user already exists
            $user = User::where('email', $googleUser->email)->first();
            
            if ($user) {
                // User exists, check if they can login
                if (!$user->canLogin()) {
                    return redirect('/login')->with('error', 'Your account is suspended or inactive.');
                }
                
                Auth::login($user);
                return redirect('/dashboard')->with('success', 'Successfully logged in with Google!');
            } else {
                // Create new user
                $user = User::create([
                    'email' => $googleUser->email,
                    'email_verified_at' => now(), // Google emails are already verified
                    'password' => Hash::make(Str::random(24)), // Random password since they use Google
                    'active' => true,
                    'suspended' => false,
                    'role_id' => 1, // Default to 'user' role
                ]);

                // Create user profile
                UserProfile::create([
                    'user_id' => $user->user_id, // Note: using user_id since that's the primary key
                    'alias' => $googleUser->name, // Using name as alias since it's required
                    'first_name' => $googleUser->user['given_name'] ?? '',
                    'last_name' => $googleUser->user['family_name'] ?? '',
                    'image_url' => $googleUser->avatar,
                    'bio' => '',
                ]);

                Auth::login($user);
                return redirect('/dashboard')->with('success', 'Account created and logged in successfully!');
            }
            
        } catch (Exception $e) {
            return redirect('/login')->with('error', 'Something went wrong with Google authentication. Please try again.');
        }
    }
}
