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
        Schema::create('events', function (Blueprint $table) {
            $table->id('event_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->string('publish_status')->default('draft'); // draft, published, cancelled
            $table->string('event_status')->default('upcoming'); // upcoming, on-going, finished
            $table->foreignId('created_by')->constrained('users_auth', 'user_id')->onDelete('cascade');
            $table->timestampsTz();

            // indexes
            $table->index('title');
            $table->index('start_date');
            $table->index('end_date');
            $table->index('publish_status');
            $table->index('event_status');
            $table->index('created_by');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
