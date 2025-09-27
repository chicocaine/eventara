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
        Schema::create('volunteer_applications', function (Blueprint $table) {
            $table->id('application_id');
            $table->foreignId('user_id')->constrained('users_auth', 'user_id')->onDelete('cascade');
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->jsonb('metadata')->nullable();
            $table->timestampsTz();

            $table->index('user_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('volunteer_applications');
    }
};
