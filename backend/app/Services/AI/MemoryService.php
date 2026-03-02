<?php

namespace App\Services\AI;

use App\Models\AiMemory;
use Illuminate\Support\Facades\DB;

class MemoryService
{
    public function __construct(
        protected VectorSearchService $vectorizer
    ) {}

    public function write(?int $universeId, string $scope, string $category, string $content, array $keywords = [], array $meta = []): AiMemory
    {
        $contentHash = $this->hashContent($content);

        $existing = AiMemory::query()
            ->where('universe_id', $universeId)
            ->where('scope', $scope)
            ->where('category', $category)
            ->where('content_hash', $contentHash)
            ->first();
        if ($existing) {
            return $existing;
        }

        $vec = $this->vectorizer->vectorize($content);
        $expiresAt = $meta['expires_at'] ?? null;
        if ($expiresAt === null && isset($meta['ttl_days'])) {
            $expiresAt = now()->addDays((int) $meta['ttl_days']);
        }
        return AiMemory::create([
            'universe_id' => $universeId,
            'scope' => $scope,
            'category' => $category,
            'keywords' => implode(',', $keywords),
            'content' => $content,
            'embedding' => $vec,
            'embedding_model' => $meta['embedding_model'] ?? config('worldos.memory.embedding_model', 'hashing-384'),
            'embedding_version' => $meta['embedding_version'] ?? config('worldos.memory.embedding_version', 'v1'),
            'source' => $meta['source'] ?? null,
            'importance' => (int) ($meta['importance'] ?? 0),
            'expires_at' => $expiresAt,
            'content_hash' => $contentHash,
        ]);
    }

    public function search(string $query, ?int $universeId = null, int $limit = 5, array $filters = []): array
    {
        $driver = (string) config('worldos.memory.driver', 'db_json');
        if ($driver !== 'db_json') {
            $driver = 'db_json';
        }

        return $this->searchDbJson($query, $universeId, $limit, $filters);
    }

    protected function searchDbJson(string $query, ?int $universeId, int $limit, array $filters): array
    {
        $qvec = $this->vectorizer->vectorize($query);

        $maxCandidates = (int) config('worldos.memory.max_candidates', 500);
        if ($maxCandidates < 1) {
            $maxCandidates = 1;
        }

        $builder = DB::table('ai_memories');

        if ($universeId !== null) {
            $builder->where(function ($q) use ($universeId) {
                $q->where('universe_id', $universeId)->orWhereNull('universe_id');
            });
        }

        $builder->where(function ($q) {
            $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
        });

        if (isset($filters['scope'])) {
            $builder->where('scope', (string) $filters['scope']);
        }
        if (isset($filters['category'])) {
            $builder->where('category', (string) $filters['category']);
        }

        $builder->orderByDesc('importance')->orderByDesc('created_at')->limit($maxCandidates);
        $rows = $builder->get(['id', 'content', 'embedding']);

        $scored = [];
        foreach ($rows as $row) {
            $emb = is_string($row->embedding) ? json_decode($row->embedding, true) : $row->embedding;
            if (!is_array($emb)) {
                $emb = [];
            }
            $score = $this->cosine($qvec, $emb);
            $scored[] = ['id' => $row->id, 'content' => $row->content, 'score' => $score];
        }

        usort($scored, function ($a, $b) {
            if ($a['score'] === $b['score']) return 0;
            return $a['score'] < $b['score'] ? 1 : -1;
        });

        $top = array_slice($scored, 0, $limit);
        return array_map(fn ($x) => $x['content'], $top);
    }

    protected function cosine(array $a, array $b): float
    {
        $n = min(count($a), count($b));
        if ($n === 0) return 0.0;
        $dot = 0.0;
        $na = 0.0;
        $nb = 0.0;
        for ($i = 0; $i < $n; $i++) {
            $dot += $a[$i] * $b[$i];
            $na += $a[$i] * $a[$i];
            $nb += $b[$i] * $b[$i];
        }
        $den = sqrt($na) * sqrt($nb);
        if ($den == 0.0) return 0.0;
        return $dot / $den;
    }

    protected function hashContent(string $content): string
    {
        $normalized = strtolower(trim(preg_replace('/\s+/', ' ', $content)));
        return sha1($normalized);
    }
}
