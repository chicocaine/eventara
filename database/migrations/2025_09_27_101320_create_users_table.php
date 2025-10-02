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
        Schema::create('users_auth', function (Blueprint $table) {
            $table->id('user_id');
            $table->string('email')->unique();
            $table->timestampTz('email_verified_at')->nullable();
            $table->string('password');
            $table->boolean('active')->default(true);
            $table->boolean('suspended')->default(false);
            $table->foreignId('role_id')->constrained('roles', 'role_id')->onDelete('restrict');
            $table->rememberToken();
            $table->timestampTz('last_login')->nullable();
            $table->timestampsTz();

            $table->index('active');
            $table->index('suspended');
            $table->index('created_at');
            $table->index('last_login');
        });
    
        Schema::create('users_profile', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users_auth', 'user_id')->onDelete('cascade');
            $table->string('alias');
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('image_url')->nullable();
            $table->string('banner_url')->nullable();
            $table->text('bio')->nullable();
            $table->jsonb('preferences')->nullable();
            
            // Certifika integration fields
            $table->string('certifika_wallet')->nullable();
            $table->string('certifika_name')->nullable();
            $table->string('certifika_email')->nullable();
            $table->string('certifika_profile_url')->nullable();
            $table->timestampTz('certifika_verified_at')->nullable();
            
            $table->timestampsTz();

            $table->index('alias');
            $table->index('first_name');
            $table->index('last_name');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestampTz('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users_profile');
        Schema::dropIfExists('users_auth');
    }
};
