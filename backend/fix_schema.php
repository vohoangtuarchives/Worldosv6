<?php
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

try {
    Schema::table('actors', function (Blueprint $table) {
        if (!Schema::hasColumn('actors', 'is_heroic')) {
            $table->boolean('is_heroic')->default(false);
            echo "Added is_heroic\n";
        }
        if (!Schema::hasColumn('actors', 'heroic_type')) {
            $table->string('heroic_type')->nullable();
            echo "Added heroic_type\n";
        }
    });
    echo "Fix attempted successfully.\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
