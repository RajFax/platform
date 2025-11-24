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
    Schema::create('zones', function (Blueprint $table) {
        $table->id();
        $table->foreignId('parcel_id')->constrained()->cascadeOnDelete();

        $table->string('name');
        $table->text('description')->nullable();
        $table->decimal('surface_ha', 8, 2)->nullable();
        $table->boolean('is_active')->default(true);

        $table->string('irrigation_strategy_type')->nullable();
        $table->json('irrigation_strategy_params')->nullable();

        $table->string('fertilization_strategy_type')->nullable();
        $table->json('fertilization_strategy_params')->nullable();

        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('zones');
    }
};
