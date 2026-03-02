<?php

namespace App\Actions\Simulation;

use App\Services\AI\VectorSearchService;

class SearchChronicleAction
{
    public function __construct(
        protected VectorSearchService $vectorSearch
    ) {}

    public function execute(int $universeId, string $query): array
    {
        if (empty(trim($query))) {
            return [
                'ok' => true,
                'results' => []
            ];
        }

        $results = $this->vectorSearch->search($universeId, $query, 10);

        return [
            'ok' => true,
            'query' => $query,
            'results' => $results->toArray()
        ];
    }
}
