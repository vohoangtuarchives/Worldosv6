# TimescaleDB setup (Phase 6)

For production time-series scaling of `universe_snapshots`:

1. Install TimescaleDB on PostgreSQL (see [timescale.com/docs](https://docs.timescale.com/)).
2. Run the optional migration after standard migrations:
   - `php artisan migrate --path=database/migrations/2025_02_26_400000_timescaledb_hypertable_universe_snapshots.php`
3. Optionally add retention and compression policies via raw SQL.

Observer events are published to Redis Streams (`universe:events`, `universe:events:{multiverse_id}`). Frontend can subscribe via WebSocket bridge or Redis XREAD.
