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
    Schema::create('parcels', function (Blueprint $table) {
        $table->id();
        $table->foreignId('farm_id')->constrained()->cascadeOnDelete();
        $table->foreignId('block_id')->nullable()->constrained()->nullOnDelete();

        $table->string('name');
        $table->decimal('surface_ha', 8, 2)->nullable();
        $table->text('description')->nullable();

        $table->string('culture_type');
        $table->string('variety')->nullable();

        $table->enum('crop_stage', [
            'VEGETATIVE',
            'FLOWERING',
            'FRUITING',
            'MATURATION',
            'POST_HARVEST',
        ])->default('VEGETATIVE');

        $table->date('planting_date')->nullable();

        $table->float('target_soil_moisture_min')->nullable();
        $table->float('target_soil_moisture_max')->nullable();
        $table->float('target_temp_min')->nullable();
        $table->float('target_temp_max')->nullable();

        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parcels');
    }
};
