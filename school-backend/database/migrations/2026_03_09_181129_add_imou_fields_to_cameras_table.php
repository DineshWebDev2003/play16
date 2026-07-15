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
        Schema::table('cameras', function (Blueprint $table) {
            $table->string('device_id')->nullable()->after('name');
            $table->integer('stream_id')->default(1)->after('device_id'); // 0: HD, 1: SD
            $table->string('proxy_path')->nullable()->after('url'); // e.g. 'sleeping_area'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cameras', function (Blueprint $table) {
            $table->dropColumn(['device_id', 'stream_id', 'proxy_path']);
        });
    }
};
