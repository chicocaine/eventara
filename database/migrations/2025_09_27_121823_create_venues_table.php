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
        Schema::create('venues', function (Blueprint $table) {
            $table->id('venue_id');
            $table->foreignId('created_by')->constrained('users_auth', 'user_id')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('address_line1');
            $table->string('address_line2')->nullable();
            $table->string('city');
            $table->string('province')->nullable();
            $table->string('state_region')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country');
            $table->integer('capacity')->nullable();
            $table->string('type')->nullable(); // e.g. hall, outdoor, stadium
            $table->string('contact_name')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('contact_email')->nullable();
            $table->timestampsTz();

            // indexes
            $table->index('name');
            $table->index('capacity');
            $table->index('type');
            $table->index('updated_at');
            $table->index('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('venues');
    }
};
