<?php

namespace App\Console\Commands;

use App\Services\Content\ContentIndexWriter;
use Illuminate\Console\Command;

class ContentIndexCommand extends Command
{
    protected $signature = 'content:index {--dry-run : Compute rows without persisting to the database}';

    protected $description = 'Sync content_index_* tables from content/cp manifests (optional DB cache for search and migration)';

    public function handle(ContentIndexWriter $writer): int
    {
        if (! config('content.index_enabled')) {
            $this->warn('Content indexing is disabled (CONTENT_INDEX_ENABLED=false).');

            return self::SUCCESS;
        }

        $gitSha = $this->resolveGitSha();
        $dry = (bool) $this->option('dry-run');

        $counts = $writer->sync($gitSha, $dry);

        $this->components->info(sprintf(
            'Indexed %d pattern(s) and %d problem(s)%s.',
            $counts['patterns'],
            $counts['problems'],
            $dry ? ' (dry run)' : ''
        ));

        if ($gitSha !== null) {
            $this->line('git sha: '.$gitSha);
        }

        return self::SUCCESS;
    }

    protected function resolveGitSha(): ?string
    {
        $base = base_path();
        $cmd = sprintf('git -C %s rev-parse HEAD', escapeshellarg($base));
        $output = [];
        $code = 0;
        exec($cmd.' 2>&1', $output, $code);

        return $code === 0 ? trim(implode("\n", $output)) : null;
    }
}
