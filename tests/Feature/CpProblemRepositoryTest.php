<?php

namespace Tests\Feature;

use App\Services\Content\Dto\ProblemBundleDto;
use App\Services\Content\ProblemRepository;
use Tests\TestCase;

class CpProblemRepositoryTest extends TestCase
{
    public function test_loads_pilot_problem_bundle(): void
    {
        $repo = $this->app->make(ProblemRepository::class);

        $bundle = $repo->getProblem('io-basics', 'a-plus-b-pilot');

        $this->assertInstanceOf(ProblemBundleDto::class, $bundle);
        $this->assertSame('a-plus-b-pilot', $bundle->manifest['problem_id']);
        $this->assertArrayHasKey('ar', $bundle->statements);
        $this->assertArrayHasKey('en', $bundle->statements);
        $this->assertSame('default', $bundle->suite['suite_id']);
        $this->assertArrayHasKey('cpp', $bundle->solutionSources);
        $this->assertArrayHasKey('python', $bundle->solutionSources);
        $this->assertNotSame('', $bundle->contentHash);
    }
}
