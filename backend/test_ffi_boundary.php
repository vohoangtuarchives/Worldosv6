<?php

require __DIR__ . '/vendor/autoload.php';

$libPath = __DIR__ . '/ffi_lib/worldos_ffi.so';
if (!file_exists($libPath)) {
    die("Library not found: $libPath\n");
}

echo "Initializing FFI...\n";
$ffi = FFI::cdef("
    char* tick_universe_emergent(const char* state_json, const char* influences_json);
    void free_rust_string(char* s);
", $libPath);

echo "Calling tick_universe_emergent with large string...\n";
$largeArray = array_fill(0, 10000, ['id' => 123, 'data' => str_repeat('A', 100)]);
$state = json_encode(['tick' => 0, 'data' => $largeArray]);
echo "State size: " . strlen($state) . " bytes\n";
$influences = json_encode([]);

try {
    $resultPtr = $ffi->tick_universe_emergent($state, $influences);
    echo "FFI call successful!\n";
    if ($resultPtr !== null) {
        $result = FFI::string($resultPtr);
        echo "Result length: " . strlen($result) . "\n";
        echo "Result: " . substr($result, 0, 100) . "...\n";
        
        // echo "Freeing string...\n";
        // $ffi->free_rust_string($resultPtr);
    }
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "Done.\n";
