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
    Schema::create('alerts', function (Blueprint $table) {
        $table->id();

        $table->foreignId('zone_id')->nullable()->constrained()->nullOnDelete();
        $table->foreignId('sensor_id')->nullable()->constrained()->nullOnDelete();
        $table->foreignId('controller_id')->nullable()->constrained()->nullOnDelete();

        $table->string('type');
        $table->string('severity')->default('WARNING');
        $table->string('message');

        $table->dateTime('raised_at');
        $table->dateTime('cleared_at')->nullable();

        $table->string('status')->default('OPEN');

        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
