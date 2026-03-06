<?php

use App\Models\NarrativeSeries;
use App\Services\IpFactory\SerialStoryService;
use Illuminate\Support\Facades\Log;

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

/**
 * Test script to verify NarrativeLoom integration and chapter length.
 */
function verifyNarrativeExpansion() {
    $series = NarrativeSeries::first();
    if (!$series) {
        echo "No series found to test.\n";
        return;
    }

    echo "Testing Narrative Expansion for Series: {$series->title} (#{$series->id})\n";
    
    $service = app(SerialStoryService::class);
    
    try {
        echo "Generating next chapter (this may take a while)...\n";
        $chapter = $service->generateNextChapter($series);
        
        $charCount = mb_strlen($chapter->content);
        $wordCount = str_word_count(strip_tags($chapter->content));
        
        echo "Chapter Generated Successfully!\n";
        echo "Title: {$chapter->title}\n";
        echo "Character Count: {$charCount}\n";
        echo "Word Count: {$wordCount}\n";
        
        if ($charCount > 2000) {
            echo "[SUCCESS] Chapter length meets the >2000 characters goal.\n";
        } else {
            echo "[WARNING] Chapter length ({$charCount}) is below the >2000 characters goal.\n";
        }
        
        echo "\nExcerpt:\n" . mb_substr($chapter->content, 0, 500) . "...\n";
        
    } catch (\Exception $e) {
        echo "[ERROR] Chapter generation failed: " . $e->getMessage() . "\n";
    }
}

verifyNarrativeExpansion();
