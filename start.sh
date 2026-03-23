#!/bin/bash
set -e

# Start Laravel backend on port 8000
cd /home/runner/workspace/backend
php artisan config:clear
php artisan serve --host=0.0.0.0 --port=8000 &
BACKEND_PID=$!

# Start Next.js frontend on port 5000
cd /home/runner/workspace/frontend
BACKEND_URL=http://localhost:8000 npm run dev

# If frontend exits, kill backend
kill $BACKEND_PID 2>/dev/null || true
