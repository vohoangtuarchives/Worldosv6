<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('actor_prophecy_beliefs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prophecy_id')->constrained()->cascadeOnDelete();
            $table->float('belief_strength')->default(0.5)->unsigned();
            $table->timestamps();

            $table->unique(['actor_id', 'prophecy_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('actor_prophecy_beliefs');
    }
};
