<?php

namespace App\Modules\Simulation\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Phase 71: Rule Mutation Service 🧬🧪
 * 
 * Quản lý việc lưu trữ và áp dụng các "đột biến" (mutations) vào logic DSL.
 * Hỗ trợ persistence cho quá trình Autopoiesis (Mã nguồn tự sinh).
 */
class RuleMutationService
{
    protected string $storageBase = 'simulation/mutated_rules';

    /**
     * Apply a mutation with versioning.
     */
    public function applyMutation(string $dslPath, string $newContent, array $metadata = []): bool
    {
        $hash = md5($dslPath);
        $timestamp = now()->timestamp;
        $versionDir = "{$this->storageBase}/{$hash}";
        $versionFile = "{$versionDir}/v{$timestamp}.dsl";
        $currentFile = "{$versionDir}/current.dsl";

        try {
            if (!Storage::disk('local')->exists($versionDir)) {
                Storage::disk('local')->makeDirectory($versionDir);
            }

            // Save new version
            Storage::disk('local')->put($versionFile, $newContent);
            // Update pointer
            Storage::disk('local')->put($currentFile, $newContent);
            
            Log::info("RuleMutationService: Applied mutation to $dslPath (v{$timestamp})", [
                'meta' => $metadata,
                'path' => $versionFile
            ]);

            $this->clearCausalCache();
            return true;
        } catch (\Exception $e) {
            Log::error("RuleMutationService: Failed to apply mutation", ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Rollback to a specific version or the previous one.
     */
    public function rollbackMutation(string $dslPath, ?int $timestamp = null): bool
    {
        $hash = md5($dslPath);
        $versionDir = "{$this->storageBase}/{$hash}";

        if (!Storage::disk('local')->exists($versionDir)) {
            return false;
        }

        $files = collect(Storage::disk('local')->files($versionDir))
            ->filter(fn($f) => str_ends_with($f, '.dsl') && !str_contains($f, 'current.dsl'))
            ->sortDesc();

        $targetFile = $timestamp 
            ? "{$versionDir}/v{$timestamp}.dsl"
            : $files->skip(1)->first(); // Previous version

        if ($targetFile && Storage::disk('local')->exists($targetFile)) {
            $content = Storage::disk('local')->get($targetFile);
            Storage::disk('local')->put("{$versionDir}/current.dsl", $content);
            Log::warning("RuleMutationService: Rolled back $dslPath to $targetFile");
            $this->clearCausalCache();
            return true;
        }

        return false;
    }

    public function getMutatedContent(string $originalPath): ?string
    {
        $hash = md5($originalPath);
        $currentFile = "{$this->storageBase}/{$hash}/current.dsl";

        if (Storage::disk('local')->exists($currentFile)) {
            return Storage::disk('local')->get($currentFile);
        }

        return null;
    }

    public function getMutationHistory(string $dslPath): array
    {
        $hash = md5($dslPath);
        return Storage::disk('local')->files("{$this->storageBase}/{$hash}");
    }

    private function clearCausalCache(): void
    {
        try {
            $cacheService = app(\App\Modules\Simulation\Services\CausalCacheService::class);
            $cacheService->clear(); 
        } catch (\Exception $e) {
            // Cache service might not be available in all contexts
        }
    }
}

