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
    Schema::create('weather_stations', function (Blueprint $table) {
        $table->id();
        $table->foreignId('farm_id')->constrained()->cascadeOnDelete();

        $table->string('name');
        $table->string('location_type')->nullable();

        $table->decimal('latitude', 10, 7)->nullable();
        $table->decimal('longitude', 10, 7)->nullable();
        $table->float('elevation_m')->nullable();

        $table->string('status')->default('ONLINE');
        $table->json('metadata')->nullable();

        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('weather_stations');
    }
};
