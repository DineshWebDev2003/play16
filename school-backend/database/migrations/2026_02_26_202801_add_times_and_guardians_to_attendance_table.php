<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            $table->string('in_time')->nullable();
            $table->string('out_time')->nullable();
            $table->string('dropped_by_type')->nullable();
            $table->string('picked_by_type')->nullable();
            $table->string('dropped_by_name')->nullable();
            $table->string('picked_by_name')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            $table->dropColumn(['in_time', 'out_time', 'dropped_by_type', 'picked_by_type', 'dropped_by_name', 'picked_by_name']);
        });
    }
};
