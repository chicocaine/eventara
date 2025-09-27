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
        Schema::create('venue_rating', function (Blueprint $table) {
            $table->id('rating_id');
            $table->foreignId('user_id')->constrained('users_auth', 'user_id')->onDelete('cascade');
            $table->foreignId('venue_id')->constrained('venues', 'venue_id')->onDelete('cascade');
            $table->unsignedTinyInteger('rating'); // 1–5 stars
            $table->timestampsTz();

            // indexes
            $table->index('user_id');
            $table->index('venue_id');
            $table->unique(['user_id', 'venue_id']); // one rating per user per venue
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('venue_rating');
    }
};
