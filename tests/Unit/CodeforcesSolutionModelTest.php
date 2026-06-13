<?php

namespace Tests\Unit;

use App\Models\CodeforcesSolution;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CodeforcesSolutionModelTest extends TestCase
{
    use RefreshDatabase;

    protected function defineDatabaseMigrations(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');
    }

    public function test_can_create_solution_with_fillable_attributes(): void
    {
        $solution = CodeforcesSolution::create([
            'problem_text' => 'Find max in array.',
            'status' => CodeforcesSolution::STATUS_PENDING,
        ]);

        $this->assertSame('Find max in array.', $solution->problem_text);
        $this->assertSame(CodeforcesSolution::STATUS_PENDING, $solution->status);
        $this->assertNull($solution->parsed_problem);
        $this->assertNull($solution->solution_code);
    }

    public function test_casts_parsed_problem_and_tests_to_array(): void
    {
        $solution = CodeforcesSolution::create([
            'problem_text' => 'P',
            'problem_text_translations' => ['ar' => 'مسألة', 'en' => 'Problem'],
            'parsed_problem' => ['title' => 'T', 'examples' => []],
            'parsed_problem_translations' => [
                'ar' => ['title' => 'العنوان', 'examples' => []],
                'en' => ['title' => 'Title', 'examples' => []],
            ],
            'explanation_translations' => ['ar' => 'شرح', 'en' => 'Explanation'],
            'generated_tests' => [['input' => '1', 'expected_output' => '2']],
            'run_results' => null,
            'algorithm_breakdown_translations' => ['ar' => 'تحليل', 'en' => 'Analysis'],
            'status' => CodeforcesSolution::STATUS_COMPLETED,
        ]);

        $this->assertIsArray($solution->parsed_problem);
        $this->assertSame('T', $solution->parsed_problem['title']);
        $this->assertSame('Problem', $solution->problem_text_translations['en']);
        $this->assertSame('العنوان', $solution->parsed_problem_translations['ar']['title']);
        $this->assertSame('Explanation', $solution->explanation_translations['en']);
        $this->assertSame('Analysis', $solution->algorithm_breakdown_translations['en']);
        $this->assertIsArray($solution->generated_tests);
        $this->assertSame('1', $solution->generated_tests[0]['input']);
    }

    public function test_table_name_is_codeforces_solutions(): void
    {
        $this->assertSame('codeforces_solutions', (new CodeforcesSolution)->getTable());
    }

    public function test_fillable_attributes(): void
    {
        $fillable = (new CodeforcesSolution)->getFillable();
        $this->assertContains('problem_text', $fillable);
        $this->assertContains('problem_text_translations', $fillable);
        $this->assertContains('parsed_problem', $fillable);
        $this->assertContains('parsed_problem_translations', $fillable);
        $this->assertContains('solution_code', $fillable);
        $this->assertContains('status', $fillable);
        $this->assertContains('algorithm_breakdown', $fillable);
        $this->assertContains('algorithm_breakdown_translations', $fillable);
    }

    public function test_status_constants(): void
    {
        $this->assertSame('pending', CodeforcesSolution::STATUS_PENDING);
        $this->assertSame('processing', CodeforcesSolution::STATUS_PROCESSING);
        $this->assertSame('completed', CodeforcesSolution::STATUS_COMPLETED);
        $this->assertSame('failed', CodeforcesSolution::STATUS_FAILED);
    }

    public function test_can_update_solution(): void
    {
        $solution = CodeforcesSolution::create([
            'problem_text' => 'P',
            'status' => CodeforcesSolution::STATUS_PROCESSING,
        ]);

        $solution->update([
            'solution_code' => '#include <iostream>',
            'solution_language' => 'cpp',
            'status' => CodeforcesSolution::STATUS_COMPLETED,
        ]);

        $this->assertSame('#include <iostream>', $solution->fresh()->solution_code);
        $this->assertSame(CodeforcesSolution::STATUS_COMPLETED, $solution->fresh()->status);
    }
}
