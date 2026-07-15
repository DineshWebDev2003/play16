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
        Schema::table('users', function (Blueprint $table) {
            $table->longText('avatar')->nullable()->change();
            $table->longText('student_photo')->nullable()->change();
            $table->longText('father_photo')->nullable()->change();
            $table->longText('mother_photo')->nullable()->change();
            $table->longText('guardian_photo')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar')->nullable()->change();
            $table->string('student_photo')->nullable()->change();
            $table->string('father_photo')->nullable()->change();
            $table->string('mother_photo')->nullable()->change();
            $table->string('guardian_photo')->nullable()->change();
        });
    }
};
