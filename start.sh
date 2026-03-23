#!/bin/bash
set -e

# Start Rust simulation engine on port 50052 (HTTP bridge)
cd /home/runner/workspace/engine
./target/debug/worldos-engine &
ENGINE_PID=$!
echo "Rust engine started (PID $ENGINE_PID)"

# Give engine time to boot
sleep 1

# Start Laravel backend on port 8000
cd /home/runner/workspace/backend
php artisan config:clear
php artisan serve --host=0.0.0.0 --port=8000 &
BACKEND_PID=$!

# Start Next.js frontend on port 5000
cd /home/runner/workspace/frontend
BACKEND_URL=http://localhost:8000 npm run dev

# Cleanup on exit
kill $BACKEND_PID $ENGINE_PID 2>/dev/null || true
