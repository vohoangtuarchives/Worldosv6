#!/bin/bash
echo "Deploying WorldOS V6 Production..."

# Load .env
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Build & Start
docker compose -f deployment/docker-compose.prod.yml up -d --build --remove-orphans

echo "Waiting for database..."
sleep 10

# Migrate DB
echo "Running migrations..."
docker compose -f deployment/docker-compose.prod.yml exec -T backend php artisan migrate --force

# Optimize Laravel
docker compose -f deployment/docker-compose.prod.yml exec -T backend php artisan config:cache
docker compose -f deployment/docker-compose.prod.yml exec -T backend php artisan route:cache
docker compose -f deployment/docker-compose.prod.yml exec -T backend php artisan view:cache

echo "Deployment Complete! Visit http://localhost"
