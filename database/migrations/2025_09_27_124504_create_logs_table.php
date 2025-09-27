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
        Schema::create('logs', function (Blueprint $table) {
            $table->id('log_id');
            $table->string('log_type'); // e.g. "login", "update", "delete"
            $table->foreignId('user_id')->nullable()->constrained('users_auth', 'user_id')->onDelete('set null');
            $table->string('entity_type'); // e.g. "event", "venue", "volunteer"
            $table->unsignedBigInteger('entity_id'); // generic link to entity
            $table->timestampTz('created_at')->useCurrent();
            $table->string('ip_address', 45)->nullable(); // IPv4 or IPv6
            $table->jsonb('metadata')->nullable();

            // indexes
            $table->index('user_id');
            $table->index('entity_type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('logs');
    }
};
