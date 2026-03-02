<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Skip if not using PostgreSQL (e.g. SQLite in tests)
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        // 1. Enable Extension
        try {
            DB::statement('CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;');
        } catch (\Exception $e) {
            // Ignore if already exists or permission denied
        }

        // 2. Convert universe_snapshots to hypertable
        if (Schema::hasTable('universe_snapshots')) {
            // Check if already hypertable
            $isHypertable = DB::select("SELECT * FROM timescaledb_information.hypertables WHERE hypertable_name = 'universe_snapshots'");
            
            if (empty($isHypertable)) {
                try {
                    // Drop primary key constraint (Hypertable requires partitioning column in PK)
                    // Assuming 'id' is PK.
                    Schema::table('universe_snapshots', function (Blueprint $table) {
                        $table->dropPrimary(); 
                    });
                    
                    // Convert to Hypertable partitioned by 'tick' (integer time)
                    // chunk_time_interval = 1000 ticks per chunk
                    DB::statement("SELECT create_hypertable('universe_snapshots', 'tick', chunk_time_interval => 1000, migrate_data => true);");
                    
                    // 3. Enable Compression (Segment by universe_id for fast retrieval of specific universe history)
                    DB::statement("ALTER TABLE universe_snapshots SET (timescaledb.compress, timescaledb.compress_segmentby = 'universe_id');");
                    
                    // 4. Add Compression Policy (Compress chunks older than 5000 ticks)
                    DB::statement("SELECT add_compression_policy('universe_snapshots', 5000);");
                    
                } catch (\Exception $e) {
                    // Log error
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Irreversible
    }
};
