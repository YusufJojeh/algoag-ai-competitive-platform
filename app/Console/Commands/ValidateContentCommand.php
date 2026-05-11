<?php

namespace App\Console\Commands;

use App\Services\Content\ContentManifestValidator;
use App\Services\Content\CpContentValidator;
use Illuminate\Console\Command;

class ValidateContentCommand extends Command
{
    protected $signature = 'content:validate {--legacy-root= : Override legacy content root (patterns/problems YAML)} {--cp-root= : Override content/cp root}';

    protected $description = 'Validate AlgoAG file-based content (legacy YAML + content/cp JSON) against JSON Schema';

    public function handle(): int
    {
        $base = base_path();
        $schemaRoot = $base.DIRECTORY_SEPARATOR.'docs'.DIRECTORY_SEPARATOR.'schemas';

        $legacyRoot = $this->option('legacy-root') ?: $base.DIRECTORY_SEPARATOR.'content';
        $cpRoot = $this->option('cp-root') ?: $base.DIRECTORY_SEPARATOR.'content'.DIRECTORY_SEPARATOR.'cp';

        $legacy = new ContentManifestValidator($legacyRoot, $schemaRoot);
        $legacy->validateAll();
        foreach ($legacy->errors() as $err) {
            $this->error($err);
        }

        $cp = new CpContentValidator($cpRoot, $schemaRoot);
        $cp->validateAll();
        foreach ($cp->errors() as $err) {
            $this->error($err);
        }

        if ($legacy->hasErrors() || $cp->hasErrors()) {
            $this->components->error('Content validation failed.');

            return self::FAILURE;
        }

        $this->components->info('Content manifests are valid.');

        return self::SUCCESS;
    }
}
