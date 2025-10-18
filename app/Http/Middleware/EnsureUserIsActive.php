<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureUserIsActive
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // If user is suspended, block access
        if (isset($user->suspended) && (bool) $user->suspended === true) {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been suspended.',
                'reason' => 'suspended',
                'suspended' => true,
            ], 403);
        }

        // If user is not active, block access
        if (isset($user->active) && (bool) $user->active === false) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is inactive. Please reactivate to continue.',
                'reason' => 'inactive',
                'active' => false,
            ], 403);
        }

        return $next($request);
    }
}
