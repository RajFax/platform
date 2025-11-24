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
    Schema::create('measurements', function (Blueprint $table) {
        $table->id();
        $table->foreignId('sensor_id')->constrained()->cascadeOnDelete();

        $table->dateTime('measured_at');
        $table->float('value');
        $table->float('raw_value')->nullable();
        $table->string('quality_flag')->nullable();

        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('measurements');
    }
};
