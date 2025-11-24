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
    Schema::create('actions', function (Blueprint $table) {
        $table->id();
        $table->foreignId('zone_id')->nullable()->constrained()->nullOnDelete();
        $table->foreignId('controller_id')->nullable()->constrained()->nullOnDelete();

        $table->string('type');
        $table->string('source')->default('AUTO_STRATEGY');

        $table->dateTime('started_at');
        $table->dateTime('ended_at')->nullable();

        $table->json('parameters')->nullable();
        $table->string('result_status')->nullable();
        $table->text('message')->nullable();

        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('actions');
    }
};
