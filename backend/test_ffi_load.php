<?php
$path = '/var/www/ffi_lib/worldos_ffi.so';
if (!file_exists($path)) {
    die("Error: File not found at $path\n");
}
echo "File exists at $path. Size: " . filesize($path) . "\n";
try {
    $ffi = FFI::cdef("void free_rust_string(char* s);", $path);
    echo "FFI loaded successfully!\n";
} catch (Exception $e) {
    echo "FFI load failed: " . $e->getMessage() . "\n";
}
