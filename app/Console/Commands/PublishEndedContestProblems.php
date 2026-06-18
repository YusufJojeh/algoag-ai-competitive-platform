<?php

namespace App\Console\Commands;

use App\Modules\Arena\Services\PublishEndedContestProblemsService;
use Illuminate\Console\Command;

class PublishEndedContestProblems extends Command
{
    protected $signature = 'arena:publish-ended-problems';

    protected $description = 'Publish private contest-only problems from ended timed contests.';

    public function handle(PublishEndedContestProblemsService $publisher): int
    {
        $summary = $publisher->publishEndedContests();

        $this->info('Ended contest problem publishing complete.');
        $this->line('Contests scanned: '.$summary['contests_scanned']);
        $this->line('Problems published: '.$summary['problems_published']);
        $this->line('Difficulty counts:');
        foreach (['easy', 'medium', 'hard', 'extreme'] as $difficulty) {
            $this->line("  {$difficulty}: ".$summary['difficulty_counts'][$difficulty]);
        }

        return self::SUCCESS;
    }
}
