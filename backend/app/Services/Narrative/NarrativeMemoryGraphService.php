<?php

namespace App\Services\Narrative;

use App\Models\Chronicle;
use App\Models\HistoricalFact;
use App\Models\NarrativeEdge;
use App\Models\NarrativeNode;

/**
 * Narrative Memory Graph (Narrative v2).
 *
 * Maintains nodes (event, actor, location, institution, chronicle) and edges
 * (INVOLVED_IN, OCCURS_IN, CAUSES, INTERPRETED_AS, REMEMBERED_AS) for history tracing.
 */
class NarrativeMemoryGraphService
{
    public const NODE_TYPE_EVENT = 'event';
    public const NODE_TYPE_ACTOR = 'actor';
    public const NODE_TYPE_LOCATION = 'location';
    public const NODE_TYPE_INSTITUTION = 'institution';
    public const NODE_TYPE_CHRONICLE = 'chronicle';

    /**
     * Ensure a node exists; return its id (create if needed).
     */
    public function ensureNode(string $nodeType, ?string $refType, ?int $refId, int $universeId, array $metadata = []): int
    {
        $q = NarrativeNode::where('universe_id', $universeId)
            ->where('node_type', $nodeType);
        if ($refType !== null) {
            $q->where('ref_type', $refType);
        }
        if ($refId !== null) {
            $q->where('ref_id', $refId);
        }
        $node = $q->first();
        if ($node !== null) {
            return $node->id;
        }

        $node = NarrativeNode::create([
            'node_type' => $nodeType,
            'ref_type' => $refType,
            'ref_id' => $refId,
            'universe_id' => $universeId,
            'metadata' => $metadata,
        ]);

        return $node->id;
    }

    /**
     * Add an edge between two nodes.
     */
    public function addEdge(int $fromNodeId, int $toNodeId, string $edgeType, ?string $perspective = null, ?float $weight = null, array $metadata = []): void
    {
        NarrativeEdge::firstOrCreate(
            [
                'from_node_id' => $fromNodeId,
                'to_node_id' => $toNodeId,
                'edge_type' => $edgeType,
            ],
            [
                'perspective' => $perspective,
                'weight' => $weight,
                'metadata' => $metadata,
            ]
        );
    }

    /**
     * Record a chronicle as REMEMBERED_AS from an event (historical_fact) node.
     */
    public function linkChronicleToFact(Chronicle $chronicle, HistoricalFact $fact): void
    {
        $universeId = (int) $chronicle->universe_id;
        $eventNodeId = $this->ensureNode(self::NODE_TYPE_EVENT, 'historical_fact', $fact->id, $universeId, [
            'tick' => $fact->tick,
            'category' => $fact->category,
        ]);
        $chronicleNodeId = $this->ensureNode(self::NODE_TYPE_CHRONICLE, 'chronicle', $chronicle->id, $universeId, [
            'type' => $chronicle->type,
        ]);
        $this->addEdge($eventNodeId, $chronicleNodeId, NarrativeEdge::TYPE_REMEMBERED_AS);
    }

    /**
     * Get subgraph for an event (historical_fact id or world_event_id): nodes and edges around this event.
     *
     * @return array{nodes: array, edges: array}
     */
    public function getSubgraphForEvent(int $universeId, ?int $historicalFactId = null, ?string $worldEventId = null, int $depth = 1): array
    {
        $node = null;
        if ($historicalFactId !== null) {
            $node = NarrativeNode::where('universe_id', $universeId)
                ->where('ref_type', 'historical_fact')
                ->where('ref_id', $historicalFactId)
                ->first();
        }
        if ($node === null && $worldEventId !== null) {
            $node = NarrativeNode::where('universe_id', $universeId)
                ->where('ref_type', 'world_event')
                ->where('ref_id', $worldEventId)
                ->first();
        }
        if ($node === null) {
            return ['nodes' => [], 'edges' => []];
        }

        $nodeIds = [$node->id];
        $edgeIds = [];
        $current = [$node->id];
        for ($d = 0; $d < $depth; $d++) {
            $edges = NarrativeEdge::whereIn('from_node_id', $current)->orWhereIn('to_node_id', $current)->get();
            foreach ($edges as $e) {
                $edgeIds[$e->id] = true;
                $nodeIds[$e->from_node_id] = true;
                $nodeIds[$e->to_node_id] = true;
            }
            $current = array_keys($nodeIds);
        }

        $nodes = NarrativeNode::whereIn('id', array_keys($nodeIds))->get()->keyBy('id');
        $edges = NarrativeEdge::whereIn('id', array_keys($edgeIds))->get();

        return [
            'nodes' => $nodes->all(),
            'edges' => $edges->all(),
        ];
    }

    /**
     * Get subgraph for an actor: nodes and edges involving this actor.
     *
     * @return array{nodes: array, edges: array}
     */
    public function getSubgraphForActor(int $actorId, int $universeId, int $limit = 50): array
    {
        $actorNode = NarrativeNode::where('universe_id', $universeId)
            ->where('ref_type', 'actor')
            ->where('ref_id', $actorId)
            ->first();
        if ($actorNode === null) {
            return ['nodes' => [], 'edges' => []];
        }

        $edges = NarrativeEdge::where('from_node_id', $actorNode->id)
            ->orWhere('to_node_id', $actorNode->id)
            ->limit($limit)
            ->get();
        $nodeIds = [$actorNode->id];
        foreach ($edges as $e) {
            $nodeIds[$e->from_node_id] = true;
            $nodeIds[$e->to_node_id] = true;
        }

        $nodes = NarrativeNode::whereIn('id', array_keys($nodeIds))->get()->keyBy('id');

        return [
            'nodes' => $nodes->all(),
            'edges' => $edges->all(),
        ];
    }

    /**
     * Get causal chain from an event (edges of type CAUSES).
     *
     * @return array<int, array{from: int, to: int, edge: NarrativeEdge}>
     */
    public function getCausalChain(int $eventNodeId, int $depth = 5): array
    {
        $chain = [];
        $visited = [];
        $queue = [$eventNodeId];
        $d = 0;
        while ($d < $depth && ! empty($queue)) {
            $edges = NarrativeEdge::whereIn('from_node_id', $queue)
                ->where('edge_type', NarrativeEdge::TYPE_CAUSES)
                ->get();
            $next = [];
            foreach ($edges as $e) {
                if (! isset($visited[$e->id])) {
                    $visited[$e->id] = true;
                    $chain[] = ['from' => $e->from_node_id, 'to' => $e->to_node_id, 'edge' => $e];
                    $next[$e->to_node_id] = true;
                }
            }
            $queue = array_keys($next);
            $d++;
        }

        return $chain;
    }
}
