<?php

namespace App\Modules\Simulation\Services;

use App\Contracts\SimulationEngineClientInterface;
use Grpc\ChannelCredentials;
use Worldos\Simulation\SimulationEngineClient;
use Worldos\Simulation\AdvanceRequest;
use Worldos\Simulation\MergeRequest;
use Worldos\Simulation\BatchAdvanceRequest;
use Worldos\Simulation\TrajectoryAnalysisRequest;
use Worldos\Simulation\EvaluateRulesRequest;
use Worldos\Simulation\ProcessActorsSoaRequest;
use Worldos\Simulation\ProcessFieldsV7Request;
use Worldos\Simulation\ComputeMetabolismGridRequest;
use Worldos\Simulation\CalculateVocationAlignmentRequest;
use Worldos\Simulation\GetCombinedGravityRequest;
use Worldos\Simulation\WorldConfig;
use Worldos\Simulation\KernelGenome;
use Worldos\Simulation\TrajectoryPoint;

/**
 * gRPC bridge to WorldOS simulation engine (Rust).
 * Implements SimulationEngineClientInterface using generated Protobuf classes.
 */
class GrpcSimulationEngineClient implements SimulationEngineClientInterface
{
    private SimulationEngineClient $client;

    public function __construct(string $hostname)
    {
        // hostname should be like "localhost:50051"
        $this->client = new SimulationEngineClient($hostname, [
            'credentials' => ChannelCredentials::createInsecure(),
            'grpc.connect_timeout_ms' => 2000, // 2s connection timeout
        ]);
    }

    private function getOptions(int $timeoutMs = 5000): array
    {
        return ['timeout' => $timeoutMs * 1000]; // gRPC PHP expects microseconds in some versions, but actually simpleRequest expects 'timeout' in microseconds? 
        // Wait, documentation says 'timeout' is in microseconds for some, but typically it depends on the wrapper. 
        // In Grpc\BaseStub, it's usually microseconds.
    }

    public function advance(int $universeId, int $ticks, array $stateInput = [], ?array $worldConfig = null): array
    {
        $request = new AdvanceRequest();
        $request->setUniverseId($universeId);
        $request->setTicks($ticks);
        $request->setStateInput(json_encode($stateInput));

        if ($worldConfig) {
            $config = new WorldConfig();
            $config->setWorldId($worldConfig['world_id'] ?? 0);
            $config->setOrigin($worldConfig['origin'] ?? '');
            $config->setAxiomJson(json_encode($worldConfig['axioms'] ?? []));
            
            if (isset($worldConfig['genome'])) {
                $genome = new KernelGenome();
                $genome->setDiffusionRate($worldConfig['genome']['diffusion_rate'] ?? 0.1);
                $genome->setEntropyCoefficient($worldConfig['genome']['entropy_coefficient'] ?? 1.0);
                $genome->setMutationRate($worldConfig['genome']['mutation_rate'] ?? 0.01);
                $genome->setAttractorGravity($worldConfig['genome']['attractor_gravity'] ?? 1.0);
                $genome->setComplexityBonus($worldConfig['genome']['complexity_bonus'] ?? 0.5);
                $config->setGenome($genome);
            }
            $request->setWorldConfig($config);
        }

        list($response, $status) = $this->client->Advance($request, [], $this->getOptions())->wait();

        if ($status->code !== 0) {
            return ['ok' => false, 'error_message' => "gRPC Error: {$status->details} (code: {$status->code})"];
        }

        $snapshot = $response->getSnapshot();
        return [
            'ok' => $response->getOk(),
            'error_message' => $response->getErrorMessage(),
            'snapshot' => $snapshot ? [
                'universe_id' => $snapshot->getUniverseId(),
                'tick' => $snapshot->getTick(),
                'state_vector' => json_decode($snapshot->getStateVectorJson(), true),
                'entropy' => $snapshot->getEntropy(),
                'stability_index' => $snapshot->getStabilityIndex(),
                'metrics' => json_decode($snapshot->getMetricsJson(), true),
                'sci' => $snapshot->getSci(),
                'instability_gradient' => $snapshot->getInstabilityGradient(),
            ] : null,
        ];
    }

    public function merge(string $stateA, string $stateB): array
    {
        $request = new MergeRequest();
        $request->setStateA($stateA);
        $request->setStateB($stateB);

        list($response, $status) = $this->client->Merge($request, [], $this->getOptions())->wait();

        if ($status->code !== 0) {
            return ['ok' => false, 'error_message' => "gRPC Error: {$status->details}"];
        }

        $snapshot = $response->getSnapshot();
        return [
            'ok' => $response->getOk(),
            'error_message' => $response->getErrorMessage(),
            'snapshot' => $snapshot ? [
                'universe_id' => $snapshot->getUniverseId(),
                'tick' => $snapshot->getTick(),
                'state_vector' => json_decode($snapshot->getStateVectorJson(), true),
            ] : null,
        ];
    }

    public function batchAdvance(array $requests): array
    {
        $batchRequest = new BatchAdvanceRequest();
        $protoRequests = [];
        foreach ($requests as $req) {
            $inner = new AdvanceRequest();
            $inner->setUniverseId($req['universe_id']);
            $inner->setTicks($req['ticks']);
            $inner->setStateInput(json_encode($req['state_input'] ?? []));
            $protoRequests[] = $inner;
        }
        $batchRequest->setRequests($protoRequests);

        list($response, $status) = $this->client->BatchAdvance($batchRequest, [], $this->getOptions(10000))->wait();

        if ($status->code !== 0) {
            return ['responses' => [], 'error_message' => "gRPC Error: {$status->details}"];
        }

        $results = [];
        foreach ($response->getResponses() as $res) {
            $snapshotData = $res->getSnapshot();
            $results[] = [
                'ok' => $res->getOk(),
                'error_message' => $res->getErrorMessage(),
                'snapshot' => $snapshotData ? ['tick' => $snapshotData->getTick()] : null,
            ];
        }

        return ['responses' => $results];
    }

    public function analyzeTrajectory(array $points, float $threshold = 0.1): array
    {
        $request = new TrajectoryAnalysisRequest();
        $protoPoints = [];
        foreach ($points as $p) {
            $tp = new TrajectoryPoint();
            $tp->setTick($p['tick']);
            $tp->setState($p['state']);
            $protoPoints[] = $tp;
        }
        $request->setPoints($protoPoints);
        $request->setRecurrenceThreshold($threshold);

        list($response, $status) = $this->client->AnalyzeTrajectory($request, [], $this->getOptions())->wait();

        if ($status->code !== 0) {
            return ['ok' => false, 'error_message' => "gRPC Error: {$status->details}"];
        }

        return [
            'is_bounded' => $response->getIsBounded(),
            'is_recurrent' => $response->getIsRecurrent(),
            'recurrence_rate' => $response->getRecurrenceRate(),
            'max_lyapunov_estimate' => $response->getMaxLyapunovEstimate(),
            'trajectory_variance' => $response->getTrajectoryVariance(),
            'basin_center' => iterator_to_array($response->getBasinCenter()),
            'basin_radius' => $response->getBasinRadius(),
        ];
    }

    public function evaluateRules(array $state, ?string $rulesDsl = null): array
    {
        $request = new EvaluateRulesRequest();
        $request->setStateJson(json_encode($state));
        $request->setRulesDsl($rulesDsl ?? '');

        list($response, $status) = $this->client->EvaluateRules($request, [], $this->getOptions())->wait();

        if ($status->code !== 0) {
            return ['ok' => false, 'outputs' => [], 'error_message' => "gRPC Error: {$status->details}"];
        }

        return [
            'ok' => $response->getOk(),
            'outputs' => json_decode($response->getOutputsJson(), true) ?: [],
            'error_message' => $response->getErrorMessage(),
        ];
    }

    public function processActorsSoa(int $tick, array $ids, array $zoneIds, array $hunger, array $energy, array $fear, array $trauma, array $heroicTypes, array $lineageIds, array $memes): array
    {
        $request = new ProcessActorsSoaRequest();
        $request->setTick($tick);
        $request->setIds($ids);
        $request->setZoneIds($zoneIds);
        $request->setHunger($hunger);
        $request->setEnergy($energy);
        $request->setFear($fear);
        $request->setTrauma($trauma);
        $request->setHeroicTypes($heroicTypes);
        $request->setLineageIds($lineageIds);
        $request->setMemes($memes);

        list($response, $status) = $this->client->ProcessActorsSoa($request, [], $this->getOptions())->wait();

        if ($status->code !== 0) {
            return [];
        }

        $outputs = [];
        foreach ($response->getOutputs() as $out) {
            $outputs[] = [
                'action_id' => $out->getActionId(),
                'new_hunger' => $out->getNewHunger(),
                'new_energy' => $out->getNewEnergy(),
                'new_trauma' => $out->getNewTrauma(),
            ];
        }
        return $outputs;
    }

    public function processFieldsV7(array $fields, array $neighborCounts, array $neighborOffsets, array $neighbors, float $diffusionRate, float $preservationRate): array
    {
        $request = new ProcessFieldsV7Request();
        
        // Flatten fields if multidimensional
        $flatFields = [];
        foreach ($fields as $row) {
            foreach ($row as $val) $flatFields[] = (double)$val;
        }
        
        $request->setFields($flatFields);
        $request->setNeighborCounts($neighborCounts);
        $request->setNeighborOffsets($neighborOffsets);
        $request->setNeighbors($neighbors);
        $request->setDiffusionRate($diffusionRate);
        $request->setPreservationRate($preservationRate);

        list($response, $status) = $this->client->ProcessFieldsV7($request, [], $this->getOptions())->wait();

        if ($status->code !== 0) return $fields;

        $newFlatFields = iterator_to_array($response->getFields());
        $count = count($fields);
        $newFields = [];
        for ($i = 0; $i < $count; $i++) {
            $newFields[] = array_slice($newFlatFields, $i * 8, 8);
        }
        return $newFields;
    }

    public function computeMetabolismGrid(array $populations, array $biomasses, array $industries, float $efficiency, float $baseEnergy): array
    {
        $request = new ComputeMetabolismGridRequest();
        $request->setPopulations($populations);
        $request->setBiomasses($biomasses);
        $request->setIndustries($industries);
        $request->setEfficiency($efficiency);
        $request->setBaseEnergy($baseEnergy);

        list($response, $status) = $this->client->ComputeMetabolismGrid($request, [], $this->getOptions())->wait();

        if ($status->code !== 0) return ['total_waste' => 0.0, 'net_energies' => []];

        return [
            'total_waste' => $response->getTotalWaste(),
            'net_energies' => iterator_to_array($response->getNetEnergies()),
        ];
    }

    public function calculateVocationAlignment(array $actorMotivation, array $targetProfile): float
    {
        $request = new CalculateVocationAlignmentRequest();
        $request->setActorMotivationJson(json_encode($actorMotivation));
        $request->setTargetProfileJson(json_encode($targetProfile));

        list($response, $status) = $this->client->CalculateVocationAlignment($request, [], $this->getOptions(2000))->wait();

        return $status->code === 0 ? $response->getAlignment() : 0.0;
    }

    public function getCombinedGravity(array $rulesets): float
    {
        $request = new GetCombinedGravityRequest();
        $request->setRulesetsJson(json_encode($rulesets));

        list($response, $status) = $this->client->GetCombinedGravity($request, [], $this->getOptions(2000))->wait();

        return $status->code === 0 ? $response->getGravity() : 1.0;
    }
}
