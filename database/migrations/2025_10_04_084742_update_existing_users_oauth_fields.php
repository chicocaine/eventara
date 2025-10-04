<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing users who don't have auth_provider set
        // These are assumed to be email-based registrations
        DB::table('users_auth')
            ->whereNull('auth_provider')
            ->update([
                'auth_provider' => 'email',
                'password_set_by_user' => true,
                'updated_at' => now()
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reset OAuth fields for existing users
        DB::table('users_auth')
            ->where('auth_provider', 'email')
            ->update([
                'auth_provider' => null,
                'password_set_by_user' => false,
                'updated_at' => now()
            ]);
    }
};
