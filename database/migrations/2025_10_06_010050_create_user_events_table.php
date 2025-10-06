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
        Schema::create('user_events', function (Blueprint $table) {
            $table->id('user_event_id');
            $table->foreignId('user_id')->constrained('users_auth', 'user_id')->onDelete('cascade');
            $table->foreignId('event_id')->constrained('events', 'event_id')->onDelete('cascade');
            $table->foreignId('session_id')->nullable()->constrained('event_sessions', 'session_id')->onDelete('cascade');
            $table->enum('status', [
                'registered', 'confirmed', 'attended', 'cancelled', 
                'no-show', 'waitlisted', 'declined'
            ])->default('registered');
            $table->timestampsTz();

            // Indexes for better query performance
            $table->index('user_id');
            $table->index('event_id');
            $table->index('session_id');
            $table->index('status');
            $table->index('created_at');
            
            // Composite indexes for common queries
            $table->index(['user_id', 'event_id']);
            $table->index(['event_id', 'status']);
            $table->index(['user_id', 'status']);
            
            // Unique constraint to prevent duplicate registrations
            $table->unique(['user_id', 'event_id', 'session_id'], 'user_event_session_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_events');
    }
};
