<?php

namespace App\Services\Content;

use Illuminate\Support\Facades\File;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

class CpContentHasher
{
    /**
     * Stable hash of all regular files under a problem directory (sorted paths, SHA-256 of contents).
     */
    public function hashProblemDirectory(string $problemDir): string
    {
        $root = realpath($problemDir);
        if ($root === false || ! File::isDirectory($problemDir)) {
            return hash('sha256', '');
        }

        $parts = [];
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if (! $file->isFile()) {
                continue;
            }
            $pathname = $file->getPathname();
            $rel = str_replace(['\\', '/'], '/', substr($pathname, strlen($root)));
            $rel = ltrim($rel, '/');
            $parts[$rel] = hash_file('sha256', $pathname);
        }

        ksort($parts);

        return hash('sha256', json_encode($parts, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES));
    }

    /**
     * Hash a single file (for pattern manifests).
     */
    public function hashFile(string $path): string
    {
        if (! File::isFile($path)) {
            return hash('sha256', '');
        }

        return hash_file('sha256', $path);
    }
}
