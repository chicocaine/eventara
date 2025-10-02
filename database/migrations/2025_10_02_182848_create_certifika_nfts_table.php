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
        Schema::create('certifika_nfts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users_auth', 'user_id')->onDelete('cascade');
            
            // NFT Basic Info
            $table->string('tx_hash');
            $table->integer('log_index');
            $table->string('contract_address');
            $table->string('chain', 20)->default('BASE');
            $table->string('chain_icon')->nullable();
            $table->string('tx_event_id')->nullable();
            $table->json('metadata')->nullable();
            
            // Event Information
            $table->string('event_id');
            $table->string('event_name');
            $table->text('event_description')->nullable();
            $table->string('event_place')->nullable();
            $table->timestampTz('event_start_date')->nullable();
            $table->timestampTz('event_end_date')->nullable();
            $table->string('event_image_url')->nullable();
            $table->string('event_category')->nullable();
            $table->json('event_metadata')->nullable();
            
            // User Info (from Certifika)
            $table->string('certifika_wallet_address');
            $table->string('certifika_email')->nullable();
            $table->string('certifika_name')->nullable();
            $table->string('certifika_profile_media_id')->nullable();
            $table->string('certifika_profile_media_url')->nullable();
            
            // Timestamps
            $table->timestampTz('block_timestamp')->nullable();
            $table->timestampsTz();
            
            // Indexes
            $table->index('user_id');
            $table->index('certifika_wallet_address');
            $table->index('event_id');
            $table->index('chain');
            $table->index('block_timestamp');
            
            // Unique constraint
            $table->unique(['tx_hash', 'log_index'], 'unique_nft_transaction');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certifika_nfts');
    }
};
