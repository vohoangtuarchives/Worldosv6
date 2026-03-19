<?php
require 'vendor/autoload.php';

use Worldos\Simulation\SimulationEngineClient;
use Worldos\Simulation\AdvanceRequest;
use Grpc\ChannelCredentials;

$hostname = 'engine:50051';
echo "Connecting to $hostname...\n";

$client = new SimulationEngineClient($hostname, [
    'credentials' => ChannelCredentials::createInsecure(),
]);

$request = new AdvanceRequest();
$request->setUniverseId(1);
$request->setTicks(1);

echo "Sending Advance request...\n";
list($response, $status) = $client->Advance($request)->wait();

if ($status->code !== 0) {
    echo "ERROR: " . $status->details . " (code: " . $status->code . ")\n";
    exit(1);
}

echo "SUCCESS! Received snapshot for universe: " . $response->getSnapshot()->getUniverseId() . "\n";
echo "Tick: " . $response->getSnapshot()->getTick() . "\n";
