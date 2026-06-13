<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Submission;
use App\Models\Tag;
use App\Models\User;
use App\Modules\Arena\Models\Contest;
use App\Modules\Problems\Models\Problem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedUser('Admin User', 'admin@example.com', 'password', true);
        $demo = $this->seedUser('Demo User', 'demo@example.com', 'password', false);
        $student = $this->seedUser('Student User', 'student@example.com', 'password', false);

        $this->seedContent();
        $this->seedSubmissions($demo, $student);
        $this->seedContest($demo, $student);
    }

    private function seedUser(string $name, string $email, string $password, bool $isAdmin): User
    {
        $user = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
            ]
        );

        // is_admin is intentionally not mass assignable; keep privilege changes explicit.
        if ((bool) $user->is_admin !== $isAdmin) {
            $user->is_admin = $isAdmin;
            $user->save();
        }

        return $user;
    }

    private function seedContent(): void
    {
        $tags = collect([
            ['name' => 'Implementation', 'slug' => 'implementation'],
            ['name' => 'Math', 'slug' => 'math'],
            ['name' => 'Two pointers', 'slug' => 'two-pointers'],
            ['name' => 'Prefix sums', 'slug' => 'prefix-sums'],
        ])->mapWithKeys(fn (array $tag) => [
            $tag['slug'] => Tag::query()->updateOrCreate(['slug' => $tag['slug']], $tag),
        ]);

        $problems = [
            [
                'data' => [
                    'title' => 'A Plus B',
                    'slug' => 'a-plus-b',
                    'statement' => "Read two integers a and b, then print their sum.\n\nInput: two integers on one line.\nOutput: one integer, a + b.",
                    'difficulty' => 'easy',
                    'time_limit_ms' => 1000,
                    'memory_limit_mb' => 256,
                ],
                'tags' => ['implementation', 'math'],
                'tests' => [
                    ['input' => "1 2\n", 'expected_output' => "3\n", 'is_sample' => true],
                    ['input' => "10 20\n", 'expected_output' => "30\n", 'is_sample' => true],
                    ['input' => "100 250\n", 'expected_output' => "350\n", 'is_sample' => false],
                    ['input' => "-5 5\n", 'expected_output' => "0\n", 'is_sample' => false],
                ],
            ],
            [
                'data' => [
                    'title' => 'Pair With Target Sum',
                    'slug' => 'pair-with-target-sum',
                    'statement' => "Given a sorted array and a target value, determine whether two distinct elements sum to the target.\n\nInput: first line contains n and the target; second line contains n sorted integers.\nOutput: YES if two distinct elements sum to the target, otherwise NO.",
                    'difficulty' => 'medium',
                    'time_limit_ms' => 2000,
                    'memory_limit_mb' => 256,
                ],
                'tags' => ['two-pointers'],
                'tests' => [
                    ['input' => "4 9\n1 2 4 7\n", 'expected_output' => "YES\n", 'is_sample' => true],
                    ['input' => "3 8\n1 2 4\n", 'expected_output' => "NO\n", 'is_sample' => true],
                    ['input' => "5 6\n1 2 3 4 5\n", 'expected_output' => "YES\n", 'is_sample' => false],
                ],
            ],
            [
                'data' => [
                    'title' => 'Range Sum Queries',
                    'slug' => 'range-sum-queries',
                    'statement' => "Given an array and q inclusive range queries, answer each range sum efficiently after preprocessing prefix sums.\n\nInput: first line contains n and q; second line contains n integers; each of the next q lines contains l and r (1-indexed, inclusive).\nOutput: q lines, each the sum over the queried range.",
                    'difficulty' => 'medium',
                    'time_limit_ms' => 2000,
                    'memory_limit_mb' => 512,
                ],
                'tags' => ['prefix-sums'],
                'tests' => [
                    ['input' => "5 2\n1 2 3 4 5\n1 3\n2 5\n", 'expected_output' => "6\n14\n", 'is_sample' => true],
                    ['input' => "3 1\n10 20 30\n1 3\n", 'expected_output' => "60\n", 'is_sample' => false],
                ],
            ],
        ];

        foreach ($problems as $problemSeed) {
            $problem = Problem::query()->updateOrCreate(
                ['slug' => $problemSeed['data']['slug']],
                $problemSeed['data']
            );

            $problem->tags()->sync(
                collect($problemSeed['tags'])->map(fn (string $slug) => $tags[$slug]->id)->all()
            );

            // Rebuild the official test cases idempotently.
            $problem->testCases()->delete();
            foreach (array_values($problemSeed['tests']) as $ordinal => $test) {
                $problem->testCases()->create([
                    'ordinal' => $ordinal,
                    'input' => $test['input'],
                    'expected_output' => $test['expected_output'],
                    'is_sample' => $test['is_sample'],
                ]);
            }
        }

        $course = Course::query()->updateOrCreate(
            ['slug' => 'competitive-programming-foundations'],
            [
                'title' => 'Competitive Programming Foundations',
                'description' => 'A practical path through input/output, implementation, two pointers, and prefix sums.',
            ]
        );

        foreach ([
            ['position' => 1, 'title' => 'Reading Input Reliably', 'body' => 'Practice parsing common contest input formats and producing exact output.'],
            ['position' => 2, 'title' => 'Linear Scans and Invariants', 'body' => 'Learn how to maintain loop invariants while scanning arrays once.'],
            ['position' => 3, 'title' => 'Prefix Sum Preprocessing', 'body' => 'Use cumulative sums to answer repeated range queries efficiently.'],
        ] as $lesson) {
            $course->lessons()->updateOrCreate(
                ['position' => $lesson['position']],
                $lesson
            );
        }
    }

    private function seedSubmissions(User $demo, User $student): void
    {
        $problem = Problem::query()->where('slug', 'a-plus-b')->first();

        if (! $problem) {
            return;
        }

        foreach ([
            [$demo, 'cpp', 'accepted'],
            [$student, 'python', 'wrong_answer'],
        ] as [$user, $language, $verdict]) {
            Submission::query()->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'problem_id' => $problem->id,
                    'language' => $language,
                ],
                [
                    'code' => $language === 'cpp' ? '#include <bits/stdc++.h>' : 'print(input())',
                    'verdict' => $verdict,
                    'judge_meta' => ['seeded' => true],
                ]
            );
        }
    }

    private function seedContest(User $demo, User $student): void
    {
        $contest = Contest::query()->updateOrCreate(
            ['slug' => 'beginners-round-1'],
            [
                'title' => 'Beginners Round 1',
                'description' => 'A short warm-up round covering input/output, two pointers, and prefix sums.',
                'starts_at' => now()->subHour(),
                'ends_at' => now()->addHours(2),
                'is_public' => true,
            ]
        );

        $labels = ['a-plus-b' => 'A', 'pair-with-target-sum' => 'B', 'range-sum-queries' => 'C'];
        $problems = Problem::query()->whereIn('slug', array_keys($labels))->get();

        $this->syncContestProblems($contest, $problems, $labels);

        // A practice contest: open to anyone, anytime (still requires joining).
        $practice = Contest::query()->updateOrCreate(
            ['slug' => 'practice-arena'],
            [
                'title' => 'Practice Arena',
                'description' => 'Practice the same problems anytime — no time limit.',
                'starts_at' => null,
                'ends_at' => null,
                'is_public' => true,
                'is_practice' => true,
            ]
        );
        $this->syncContestProblems($practice, $problems, $labels);

        foreach ([$demo, $student] as $participant) {
            $contest->participants()->syncWithoutDetaching([
                $participant->id => ['registered_at' => now()->subHour()],
            ]);
        }

        // A seeded accepted submission so the standings table is non-empty.
        $aPlusB = $problems->firstWhere('slug', 'a-plus-b');
        if ($aPlusB) {
            Submission::query()->updateOrCreate(
                ['user_id' => $demo->id, 'problem_id' => $aPlusB->id, 'contest_id' => $contest->id],
                [
                    'language' => 'python',
                    'code' => "a, b = map(int, input().split())\nprint(a + b)",
                    'verdict' => 'accepted',
                    'status' => Submission::STATUS_COMPLETED,
                    'judge_meta' => ['seeded' => true],
                ]
            );
        }
    }

    /**
     * Idempotently set a contest's problems with their labels.
     *
     * @param  \Illuminate\Support\Collection<int, Problem>  $problems
     * @param  array<string, string>  $labels  slug => label
     */
    private function syncContestProblems(Contest $contest, $problems, array $labels): void
    {
        $contest->contestProblems()->delete();
        $ordinal = 0;
        foreach ($problems as $problem) {
            $contest->contestProblems()->create([
                'problem_id' => $problem->id,
                'label' => $labels[$problem->slug],
                'ordinal' => $ordinal++,
            ]);
        }
    }
}
