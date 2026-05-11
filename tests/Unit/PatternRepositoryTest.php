<?php

namespace Tests\Unit;

use App\Services\Content\PatternRepository;
use Tests\TestCase;

class PatternRepositoryTest extends TestCase
{
    public function test_maps_v2_pattern_manifest(): void
    {
        $repo = $this->app->make(PatternRepository::class);
        $dto = $repo->getPattern('io-basics');

        $this->assertSame(2, $dto->schemaVersion);
        $this->assertSame('io-basics', $dto->patternId);
        $this->assertNotSame([], $dto->whenToUse);
        $this->assertNotSame([], $dto->representativeProblemRefs);
        $this->assertSame('sorting', $dto->benchmarkKey);
        $this->assertIsArray($dto->ollamaMatching);
        $this->assertArrayHasKey('keywords', $dto->ollamaMatching);
    }

    public function test_pattern_dto_to_array_is_serializable(): void
    {
        $repo = $this->app->make(PatternRepository::class);
        $dto = $repo->getPattern('two-pointers');
        $arr = $dto->toArray();

        $this->assertSame('two_pointers', $arr['benchmark_key']);
        $this->assertContains('io-basics', $arr['related_pattern_ids']);
    }
}
