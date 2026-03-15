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
        Schema::create('causal_trajectories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('universe_id')->constrained()->onDelete('cascade');
            $table->integer('target_tick'); // The future tick this causal_trajectory refers to
            $table->text('content'); // Dramatic description of the vision
            $table->float('probability')->default(0.5); // How likely is it to happen
            $table->string('type')->default('event'); // event, collapse, stasis, etc.
            $table->boolean('is_fulfilled')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('causal_trajectories');
    }
};
