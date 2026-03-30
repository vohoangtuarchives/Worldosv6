<?php

namespace App\Modules\Intelligence\Contracts;

interface LlmDriverInterface
{
    /**
     * Send a chat request to the LLM.
     *
     * @param  array  $messages  List of messages (role, content)
     * @param  array  $options   Additional options (temperature, max_tokens, etc.)
     * @return string|null
     */
    /**
     * Send a completion request to the LLM (standalone prompt).
     *
     * @param  string  $prompt
     * @param  array   $options
     * @return string|null
     */
    public function generate(string $prompt, array $options = []): ?string;
}
