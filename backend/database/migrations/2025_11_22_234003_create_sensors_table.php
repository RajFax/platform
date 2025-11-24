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
    Schema::create('sensors', function (Blueprint $table) {
        $table->id();
        $table->foreignId('zone_id')->constrained()->cascadeOnDelete();

        $table->string('name');
        $table->string('type');
        $table->string('unit')->nullable();

        $table->string('hardware_id')->nullable();
        $table->json('position')->nullable();
        $table->boolean('is_active')->default(true);
        $table->json('calibration_info')->nullable();

        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sensors');
    }
};
