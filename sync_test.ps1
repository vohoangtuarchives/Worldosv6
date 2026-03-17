Get-Content -Raw backend/tests/Feature/Simulation/MultiverseConvergenceTest.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/tests/Feature/Simulation/MultiverseConvergenceTest.php"
docker exec deployment-backend-1 php artisan test tests/Feature/Simulation/MultiverseConvergenceTest.php
