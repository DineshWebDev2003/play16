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
        Schema::table('announcements', function (Blueprint $table) {
            $table->longText('image_url')->nullable()->change();
        });

        Schema::table('activities', function (Blueprint $table) {
            $table->longText('media_url')->nullable()->change();
            $table->longText('thumbnail_url')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->string('image_url', 255)->nullable()->change();
        });

        Schema::table('activities', function (Blueprint $table) {
            $table->string('media_url', 255)->nullable()->change();
            $table->string('thumbnail_url', 255)->nullable()->change();
        });
    }
};
