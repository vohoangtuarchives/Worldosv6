<?php

$dir = __DIR__ . '/backend';

$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
foreach ($iterator as $file) {
    if ($file->isFile() && $file->getExtension() === 'php') {
        $path = $file->getPathname();
        $content = file_get_contents($path);
        $newContent = $content;

        // Remove use App\Models\Saga;
        $newContent = preg_replace('/^use App\\\\Models\\\\Saga;\r?\n/m', '', $newContent);

        // Remove saga_id from $fillable, $casts arrays in Models
        $newContent = preg_replace('/\'saga_id\',\s*/', '', $newContent);
        $newContent = preg_replace('/"saga_id",\s*/', '', $newContent);

        // Remove saga() relationships
        $newContent = preg_replace('/public function saga\(\)[^{]+{\s*return \$this->belongsTo\(Saga::class\);\s*}\s*/', '', $newContent);
        
        // Remove sagas() relationships from World
        $newContent = preg_replace('/public function sagas\(\)[^{]+{\s*return \$this->hasMany\(Saga::class\);\s*}\s*/', '', $newContent);

        // Replace $universe->saga_id = ... with nothing
        $newContent = preg_replace('/\$[a-zA-Z0-9_]->saga_id\s*=\s*[^;]+;\r?\n/', '', $newContent);

        // Remove $sagaId argument from SagaService spawnUniverse
        $newContent = str_replace('?int $sagaId = null, ', '', $newContent);
        $newContent = str_replace('\'saga_id\' => $sagaId,', '', $newContent);

        // Note: the rest of SagaService might require manual refactoring but this takes care of the bulk.
        // We'll surgically fix SagaService later.

        if ($content !== $newContent) {
            file_put_contents($path, $newContent);
            echo "Cleaned saga refs in: $path\n";
        }
    }
}

echo "Done\n";
