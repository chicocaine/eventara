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
        Schema::create('volunteers', function (Blueprint $table) {
            $table->id('volunteer_id');
            $table->foreignId('user_id')->constrained('users_auth', 'user_id')->onDelete('cascade');
            $table->string('email')->unique();
            $table->string('contact_phone')->nullable();
            $table->string('role')->nullable(); 
            $table->string('status')->default('active'); // active, inactive, suspended
            $table->timestampsTz();

            $table->index('user_id');
            $table->index('status');
            $table->index('role');
        });

        Schema::create('volunteer_availability', function (Blueprint $table) {
            $table->id('availability_id');
            $table->foreignId('volunteer_id')->constrained('volunteers', 'volunteer_id')->onDelete('cascade');
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('status')->default('available'); // available, unavailable
            $table->timestampsTz();

            $table->index('volunteer_id');
            $table->index('date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('volunteers');
        Schema::dropIfExists('volunteer_availability');
    }
};
