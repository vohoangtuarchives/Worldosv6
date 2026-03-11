<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prophecies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('universe_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('created_tick');
            $table->unsignedBigInteger('prediction_tick');
            $table->text('text');
            $table->float('confidence')->default(0.5)->unsigned();
            $table->boolean('fulfilled')->default(false);
            $table->json('source_snapshot_metrics')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prophecies');
    }
};
