docker exec deployment-backend-1 mkdir -p /var/www/app/Services/Simulation
docker exec deployment-backend-1 mkdir -p /var/www/app/Http/Controllers/Api/Simulation
docker exec deployment-backend-1 mkdir -p /var/www/tests/Feature/Simulation
Get-Content -Raw backend/app/Services/Simulation/CollapsePropagatonService.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/app/Services/Simulation/CollapsePropagatonService.php"
Get-Content -Raw backend/app/Services/Simulation/ConvergenceScoreService.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/app/Services/Simulation/ConvergenceScoreService.php"
Get-Content -Raw backend/app/Simulation/Engines/Meta/CausalBridgeEngine.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/app/Simulation/Engines/Meta/CausalBridgeEngine.php"
Get-Content -Raw backend/app/Simulation/Engines/Meta/OmegaConvergenceEngine.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/app/Simulation/Engines/Meta/OmegaConvergenceEngine.php"
Get-Content -Raw backend/app/Http/Controllers/Api/Simulation/UniverseBridgeController.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/app/Http/Controllers/Api/Simulation/UniverseBridgeController.php"
Get-Content -Raw backend/routes/api.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/routes/api.php"
Get-Content -Raw backend/tests/Feature/Simulation/MultiverseConvergenceTest.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/tests/Feature/Simulation/MultiverseConvergenceTest.php"
Get-Content -Raw backend/database/migrations/2026_03_16_201734_add_convergence_score_to_universe_bridges_table.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/database/migrations/2026_03_16_201734_add_convergence_score_to_universe_bridges_table.php"
Get-Content -Raw backend/app/Models/UniverseBridge.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/app/Models/UniverseBridge.php"
docker exec deployment-backend-1 php artisan migrate --force
docker exec deployment-backend-1 php artisan test tests/Feature/Simulation/MultiverseConvergenceTest.php

# Phase 10
Get-Content -Raw backend/app/Models/DiplomaticTreaty.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/app/Models/DiplomaticTreaty.php"
Get-Content -Raw backend/database/migrations/2026_03_16_204000_create_diplomatic_treaties_table.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/database/migrations/2026_03_16_204000_create_diplomatic_treaties_table.php"
Get-Content -Raw backend/app/Simulation/Engines/Social/DiplomacyEngine.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/app/Simulation/Engines/Social/DiplomacyEngine.php"
Get-Content -Raw backend/app/Modules/Simulation/Providers/SimulationServiceProvider.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/app/Modules/Simulation/Providers/SimulationServiceProvider.php"
Get-Content -Raw backend/tests/Feature/Simulation/DiplomacyEngineTest.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/tests/Feature/Simulation/DiplomacyEngineTest.php"
docker exec deployment-backend-1 php artisan migrate --force
docker exec deployment-backend-1 php artisan test tests/Feature/Simulation/DiplomacyEngineTest.php

# Phase 10.2: Culture
Get-Content -Raw backend/app/Models/CulturalArtifact.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/app/Models/CulturalArtifact.php"
Get-Content -Raw backend/database/migrations/2026_03_17_100000_create_cultural_artifacts_table.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/database/migrations/2026_03_17_100000_create_cultural_artifacts_table.php"
Get-Content -Raw backend/app/Simulation/Engines/Social/CultureEngine.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/app/Simulation/Engines/Social/CultureEngine.php"
Get-Content -Raw backend/tests/Feature/Simulation/CultureEngineTest.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/tests/Feature/Simulation/CultureEngineTest.php"
docker exec deployment-backend-1 php artisan migrate --force
docker exec deployment-backend-1 php artisan test tests/Feature/Simulation/CultureEngineTest.php

# Phase 10.3: Finance & Production
Get-Content -Raw backend/app/Simulation/Engines/Social/FinanceEngine.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/app/Simulation/Engines/Social/FinanceEngine.php"
Get-Content -Raw backend/app/Simulation/Engines/Social/ProductionChainEngine.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/app/Simulation/Engines/Social/ProductionChainEngine.php"
Get-Content -Raw backend/tests/Feature/Simulation/FinanceEngineTest.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/tests/Feature/Simulation/FinanceEngineTest.php"
docker exec deployment-backend-1 php artisan test tests/Feature/Simulation/FinanceEngineTest.php

# Phase 10.4: Kafka Integration
docker exec deployment-backend-1 mkdir -p /var/www/app/Events/Simulation
docker exec deployment-backend-1 mkdir -p /var/www/app/Console/Commands
docker exec deployment-backend-1 mkdir -p /var/www/tests/Feature/Simulation
Get-Content -Raw backend/app/Events/Simulation/SimulationEventStreamReceived.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/app/Events/Simulation/SimulationEventStreamReceived.php"
Get-Content -Raw backend/app/Console/Commands/KafkaEventStreamConsumeCommand.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/app/Console/Commands/KafkaEventStreamConsumeCommand.php"
Get-Content -Raw backend/tests/Feature/Simulation/KafkaEventStreamTest.php | docker exec -i deployment-backend-1 sh -c "cat > /var/www/tests/Feature/Simulation/KafkaEventStreamTest.php"
docker exec deployment-backend-1 php artisan test tests/Feature/Simulation/KafkaEventStreamTest.php
