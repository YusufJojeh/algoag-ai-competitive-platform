<?php

namespace App\Modules\Assistant\Actions;

use App\Services\OllamaService;

class SuggestAlgorithmsAction
{
    public function __construct(
        protected OllamaService $ollama
    ) {}

    /**
     * @return array<int, array<string, mixed>>
     */
    public function handle(string $problemDescription): array
    {
        return $this->ollama->suggestAlgorithms($problemDescription);
    }
}
