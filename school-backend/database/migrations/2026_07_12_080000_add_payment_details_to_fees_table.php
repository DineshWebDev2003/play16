<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('fees', function (Blueprint $table) {
            $table->string('payment_method')->nullable()->after('paid_at');
            $table->string('payer_name')->nullable()->after('payment_method');
            $table->string('payer_phone')->nullable()->after('payer_name');
        });
    }

    public function down(): void
    {
        Schema::table('fees', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'payer_name', 'payer_phone']);
        });
    }
};
