<?php

namespace App\Services\Assistant\Contracts;

interface TTSProvider
{
    /**
     * @return string File path to generated audio in storage
     */
    public function synthesize(string $text, string $language): string;
}
