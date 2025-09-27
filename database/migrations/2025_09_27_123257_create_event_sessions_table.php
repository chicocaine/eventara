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
        Schema::create('event_sessions', function (Blueprint $table) {
            $table->id('session_id');
            $table->foreignId('event_id')->constrained('events', 'event_id')->onDelete('cascade');
            $table->foreignId('venue_id')->nullable()->constrained('venues', 'venue_id')->onDelete('set null');
            $table->date('session_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('title');
            $table->text('description')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestampsTz();

            // indexes
            $table->index('event_id');
            $table->index('session_date');
            $table->index('start_time');
            $table->index('end_time');
            $table->index('title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_sessions');
    }
};
