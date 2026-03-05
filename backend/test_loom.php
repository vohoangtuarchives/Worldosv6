<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$client = new \App\Modules\Intelligence\Services\LoomIntentClient();
$actor = new \App\Modules\Intelligence\Entities\ActorEntity(
    1,
    1,
    'Test Actor',
    'Chiến Binh',
    [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
);
$ctx = new \App\Modules\Intelligence\Domain\Policy\UniverseContext(0.5, 1.0, 0.5, 0.2, 1);

var_dump($client->requestIntent($actor, $ctx));
