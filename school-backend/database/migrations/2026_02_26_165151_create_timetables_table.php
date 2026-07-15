<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('timetables', function (Blueprint $table) {
            $table->id();
            $table->tinyInteger('day'); // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
            $table->string('time');    // e.g. "09:30 AM"
            $table->string('activity');
            $table->string('room')->default('Main Area');
            $table->string('icon')->default('calendar-clock');
            $table->string('color')->default('bg-blue-500');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timetables');
    }
};
