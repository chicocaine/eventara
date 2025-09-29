<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users_auth', function (Blueprint $table) {
            // Add the suspended column if it doesn't exist
            if (!Schema::hasColumn('users_auth', 'suspended')) {
                $table->boolean('suspended')->default(false)->after('active');
                $table->index('suspended');
            }
            
            // Add default value for active column
            $table->boolean('active')->default(true)->change();
        });
        
        // Update any existing NULL values to proper defaults
        DB::table('users_auth')->whereNull('active')->update(['active' => true]);
        DB::table('users_auth')->whereNull('suspended')->update(['suspended' => false]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users_auth', function (Blueprint $table) {
            // Remove the suspended column if we added it
            if (Schema::hasColumn('users_auth', 'suspended')) {
                $table->dropColumn('suspended');
            }
            
            // Remove default from active column
            $table->boolean('active')->change();
        });
    }
};
