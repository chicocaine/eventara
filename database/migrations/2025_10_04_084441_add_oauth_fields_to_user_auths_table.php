<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users_auth', function (Blueprint $table) {
            $table->string('auth_provider')->nullable()->after('email_verified_at')
                  ->comment('Authentication provider: google, email, etc.');
            $table->boolean('password_set_by_user')->default(false)->after('auth_provider')
                  ->comment('Whether the user has set their own password (vs auto-generated)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users_auth', function (Blueprint $table) {
            $table->dropColumn(['auth_provider', 'password_set_by_user']);
        });
    }
};
