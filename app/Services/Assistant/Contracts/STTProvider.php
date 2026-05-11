<?php

namespace App\Services\Assistant\Contracts;

interface STTProvider
{
    public function transcribe(string $audioPath, string $language): string;
}
