<?php

$url = "http://host.docker.internal:8080/v1/chat/completions";
$data = [
    "model" => "qwen3-14b-uncensored",
    "messages" => [
        ["role" => "system", "content" => "You are a helpful assistant."],
        ["role" => "user", "content" => "Hello, are you there?"]
    ],
    "temperature" => 0.7
];

echo "Connecting to: $url\n";
echo "Payload: " . json_encode($data, JSON_PRETTY_PRINT) . "\n\n";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 60); // 60s for testing

$start = microtime(true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
$duration = microtime(true) - $start;

curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Duration: " . round($duration, 2) . "s\n";

if ($error) {
    echo "CURL Error: $error\n";
}
else {
    echo "Response:\n";
    echo $response . "\n";
}
