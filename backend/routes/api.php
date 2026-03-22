<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| General utility and legacy bridge routes.
| Most module-specific routes are now located in app/Modules/{Name}/routes/api.php
|
*/

// Utility: Log Testing & Viewing
Route::get('/log-test', function () {
    $path = storage_path('logs/laravel.log');
    \Illuminate\Support\Facades\Log::channel('single')->info('LOG-TEST: Laravel đã ghi log thành công.');
    @file_put_contents($path, '[' . date('Y-m-d H:i:s') . '] local.INFO: LOG-TEST: Laravel đã ghi log thành công.' . "\n", FILE_APPEND);
    return response()->json([
        'ok' => true,
        'message' => 'Đã ghi log. Kiểm tra file bên dưới.',
        'log_path' => $path,
    ]);
});

Route::get('/log-view', function () {
    $path = storage_path('logs/laravel.log');
    $maxLines = (int) request()->input('lines', 100);
    $maxLines = min(max(1, $maxLines), 500);
    if (!is_file($path)) {
        return response()->json(['ok' => false, 'log_path' => $path, 'content' => null, 'message' => 'File log chưa tồn tại.']);
    }
    $content = file_get_contents($path);
    $lines = explode("\n", $content);
    $last = array_slice($lines, -$maxLines);
    return response()->json([
        'ok' => true,
        'log_path' => $path,
        'lines' => count($last),
        'content' => implode("\n", $last),
    ]);
});

// The rest of the routes are handled by Module Service Providers
