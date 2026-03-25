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
    public function chat(array $messages, array $options = []): ?string;
}
