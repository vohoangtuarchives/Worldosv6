<?php
// Test kết nối trực tiếp tới LocalAI
$url = 'http://host.docker.internal:8080/v1/chat/completions';
$payload = json_encode([
    'model' => 'qwen3-14b-uncensored',
    'messages' => [['role' => 'user', 'content' => 'Say hello in one word']],
    'temperature' => 0.7,
]);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

echo "Sending to: $url\n";
echo "Model: qwen3-14b-uncensored\n";
echo "Timeout: 30s\n";
echo "---\n";

$start = microtime(true);
$response = curl_exec($ch);
$elapsed = round(microtime(true) - $start, 2);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "Elapsed: {$elapsed}s\n";
echo "HTTP Code: $httpCode\n";

if ($error) {
    echo "ERROR: $error\n";
}
else {
    $data = json_decode($response, true);
    if (isset($data['choices'][0]['message']['content'])) {
        echo "RESPONSE: " . $data['choices'][0]['message']['content'] . "\n";
    }
    else {
        echo "RAW: " . substr($response, 0, 500) . "\n";
    }
}
