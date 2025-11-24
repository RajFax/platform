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
    Schema::create('weather_measurements', function (Blueprint $table) {
        $table->id();
        $table->foreignId('weather_station_id')->constrained()->cascadeOnDelete();

        $table->dateTime('measured_at');

        $table->float('air_temperature')->nullable();
        $table->float('relative_humidity')->nullable();
        $table->float('wind_speed')->nullable();
        $table->float('solar_radiation')->nullable();
        $table->float('rainfall')->nullable();
        $table->float('et0')->nullable();

        $table->json('metadata')->nullable();

        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('weather_measurements');
    }
};
