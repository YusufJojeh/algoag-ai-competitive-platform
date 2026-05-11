<?php

namespace App\Services\Content;

use App\Services\Content\Exceptions\ContentCorruptException;
use Illuminate\Support\Facades\File;

class ContentFileReader
{
    /**
     * @return array<string, mixed>
     */
    public function readJson(string $path): array
    {
        if (! File::isFile($path)) {
            throw new ContentCorruptException('Missing JSON file: '.$path);
        }
        try {
            $raw = File::get($path);
            $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            throw new ContentCorruptException('Invalid JSON in '.$path.': '.$e->getMessage(), 0, $e);
        }
        if (! is_array($data)) {
            throw new ContentCorruptException('Expected JSON object at '.$path);
        }

        /** @var array<string, mixed> $data */
        return $data;
    }

    public function readUtf8(string $path): string
    {
        if (! File::isFile($path)) {
            throw new ContentCorruptException('Missing file: '.$path);
        }
        $body = File::get($path);
        if (! mb_check_encoding($body, 'UTF-8')) {
            throw new ContentCorruptException('File is not valid UTF-8: '.$path);
        }

        return $body;
    }
}
