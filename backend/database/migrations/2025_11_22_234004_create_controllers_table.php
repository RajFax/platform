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
    Schema::create('controllers', function (Blueprint $table) {
        $table->id();
        $table->foreignId('zone_id')->nullable()->constrained()->nullOnDelete();

        $table->string('name');
        $table->string('type');
        $table->string('level')->nullable();

        $table->string('mode')->default('OFF');
        $table->string('status')->default('UNKNOWN');

        $table->dateTime('last_communication_at')->nullable();
        $table->json('metadata')->nullable();

        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('controllers');
    }
};
