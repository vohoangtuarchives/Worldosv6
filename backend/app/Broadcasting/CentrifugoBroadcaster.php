<?php

namespace App\Broadcasting;

use Illuminate\Broadcasting\Broadcasters\Broadcaster;
use Illuminate\Support\Facades\Http;
use Firebase\JWT\JWT;
use Illuminate\Broadcasting\BroadcastException;

class CentrifugoBroadcaster extends Broadcaster
{
    /**
     * Authenticate the incoming request for a given channel.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  string  $channel
     * @return mixed
     */
    public function auth($request)
    {
        // Simple authentication: allow if user is authenticated or channel is public
        // For production, you should verify if $request->user() can access $channel
        return true; 
    }

    /**
     * Return the valid authentication response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  mixed  $result
     * @return mixed
     */
    public function validAuthenticationResponse($request, $result)
    {
        return $result;
    }

    /**
     * Generate a connection token for Centrifugo.
     * Useful for Frontend to connect securely via WebSocket.
     *
     * @param string $userId
     * @param int $exp
     * @return string
     */
    public function generateToken(string $userId, int $exp = 86400): string
    {
        $secret = config('centrifugo.secret');
        if (empty($secret)) {
            throw new \RuntimeException("Centrifugo secret not configured.");
        }

        $payload = [
            'sub' => $userId,
            'exp' => time() + $exp,
            'iat' => time(),
        ];

        return JWT::encode($payload, $secret, 'HS256');
    }

    /**
     * Broadcast the given event.
     *
     * @param  array  $channels
     * @param  string  $event
     * @param  array  $payload
     * @return void
     *
     * @throws \Illuminate\Broadcasting\BroadcastException
     */
    public function broadcast(array $channels, $event, array $payload = [])
    {
        $url = rtrim(config('centrifugo.url'), '/') . '/api';
        $apiKey = config('centrifugo.api_key');

        if (empty($url) || empty($apiKey)) {
            return;
        }

        // Build newline-delimited JSON body for batch publishing
        $body = "";
        foreach ($this->formatChannels($channels) as $channel) {
            $isBinary = isset($payload['tick']); // Nếu là nhịp đập vũ trụ, phát dạng nhị phân
            
            $params = ['channel' => $channel];
            if ($isBinary) {
                $params['data_base64'] = base64_encode(json_encode($payload));
            } else {
                $params['data'] = $payload;
            }

            $body .= json_encode([
                'method' => 'publish',
                'params' => $params,
            ]) . "\n";
        }

        /** @var \Illuminate\Http\Client\Response $response */
        $response = Http::withHeaders([
            'X-API-Key' => $apiKey,
            'X-Centrifugo-Error-Mode' => 'any', // Report any error in batch
        ])->withBody($body, 'application/json')->post($url);


        if ($response->failed()) {
            throw new BroadcastException(
                "Centrifugo broadcast error: " . ($response->json('error.message') ?? $response->body())
            );
        }
    }
}
