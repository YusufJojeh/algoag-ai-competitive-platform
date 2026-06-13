<?php

namespace Database\Seeders;

use App\Models\AssistantMessage;
use App\Models\AssistantSession;
use App\Models\CodeforcesSolution;
use App\Models\Submission;
use App\Models\User;
use App\Modules\Problems\Models\Problem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Heavy demo dataset for load/UI testing.
 *
 * Run with:  php artisan db:seed --class=HeavyDemoSeeder
 * (Run the base DatabaseSeeder first so problems/courses exist.)
 */
class HeavyDemoSeeder extends Seeder
{
    private const USER_COUNT = 25;

    private const SESSIONS_PER_USER = 4;

    private const EXCHANGES_PER_SESSION = 6;

    private const CF_SOLUTIONS_PER_USER = 3;

    public function run(): void
    {
        $users = $this->seedUsers();
        $this->seedAssistantActivity($users);
        $this->seedCodeforcesSolutions($users);
        $this->seedSubmissions($users);

        $this->command?->info(sprintf(
            'Heavy demo data ready: %d users, %d assistant sessions, %d messages, %d Codeforces solutions.',
            $users->count(),
            AssistantSession::count(),
            AssistantMessage::count(),
            CodeforcesSolution::count(),
        ));
    }

    /** @return \Illuminate\Support\Collection<int, User> */
    private function seedUsers()
    {
        return collect(range(1, self::USER_COUNT))->map(function (int $i) {
            return User::query()->updateOrCreate(
                ['email' => "heavy.user{$i}@example.com"],
                [
                    'name' => "Heavy User {$i}",
                    'password' => Hash::make('password'),
                ]
            );
        });
    }

    private function seedAssistantActivity($users): void
    {
        $modes = ['idea_check', 'hint', 'debug_wrong_answer', 'complexity', 'edge_cases', 'topic_explanation'];
        $userPrompts = [
            'أعتقد أن الحل two pointers على المصفوفة بعد الترتيب',
            'الحل يعطيني wrong answer على التيست الثالث',
            'getting TLE on test 10, my loop is O(n^2)',
            'أعطني تلميح بس بدون ما تكشف الحل',
            'شو الحالات الحدية يلي ممكن تكسر الفكرة؟',
            'اشرح لي الموضوع تبع هي المسألة',
        ];
        $assistantReplies = [
            'فكرتك صحيحة، لكن انتبه لحالة المصفوفة الفارغة وحالة العنصر الواحد.',
            'الخطأ في السطر الذي يقارن بدون ترتيب، جرّب counterexample بسيطاً مثل [3,1,2].',
            'الحل الحالي O(n^2)؛ استخدم prefix sums لتصل إلى O(n) — هذا يحل مشكلة الـ time limit.',
            'تلميح: فكّر بما يحدث عندما تثبّت الطرف الأيسر وتحرك الأيمن فقط.',
            'الحالات الحدية الأهم: n=1، جميع العناصر متساوية، وقيم سالبة كبيرة.',
            'الموضوع هنا هو sliding window — يظهر من قيد المجموع المتجاور في المسألة.',
        ];
        $statuses = [
            AssistantMessage::STATUS_COMPLETED,
            AssistantMessage::STATUS_COMPLETED,
            AssistantMessage::STATUS_COMPLETED,
            AssistantMessage::STATUS_COMPLETED,
            AssistantMessage::STATUS_FAILED,
            AssistantMessage::STATUS_CANCELLED,
        ];

        foreach ($users as $userIndex => $user) {
            for ($s = 1; $s <= self::SESSIONS_PER_USER; $s++) {
                $session = AssistantSession::query()->firstOrCreate(
                    ['user_id' => $user->id, 'title' => "Heavy session {$s}"],
                    [
                        'language' => $s % 2 === 0 ? 'en' : 'ar',
                        'status' => 'active',
                        'metadata' => ['seeded' => true],
                    ]
                );

                if ($session->messages()->exists()) {
                    continue;
                }

                for ($e = 0; $e < self::EXCHANGES_PER_SESSION; $e++) {
                    $variant = ($userIndex + $s + $e) % count($userPrompts);
                    $status = $statuses[$e % count($statuses)];

                    $userMessage = AssistantMessage::create([
                        'session_id' => $session->id,
                        'client_request_id' => (string) Str::uuid(),
                        'role' => 'user',
                        'content' => $userPrompts[$variant],
                        'mode' => $modes[$variant],
                        'status' => $status,
                        'provider_name' => 'openai',
                        'provider_model' => 'gpt-4o-mini',
                        'provider_latency_ms' => 800 + ($e * 150),
                        'analysis_duration_ms' => 1500 + ($e * 200),
                        'token_usage' => ['prompt_tokens' => 120 + $e, 'completion_tokens' => 60 + $e, 'total_tokens' => 180 + (2 * $e)],
                        'error_message' => $status === AssistantMessage::STATUS_FAILED ? 'تعذر إكمال التحليل حالياً. حاول مرة أخرى.' : null,
                    ]);

                    if ($status === AssistantMessage::STATUS_COMPLETED) {
                        AssistantMessage::create([
                            'session_id' => $session->id,
                            'reply_to_message_id' => $userMessage->id,
                            'client_request_id' => (string) Str::uuid(),
                            'role' => 'assistant',
                            'content' => $assistantReplies[$variant],
                            'mode' => $modes[$variant],
                            'status' => AssistantMessage::STATUS_COMPLETED,
                            'provider_name' => 'openai',
                            'provider_model' => 'gpt-4o-mini',
                            'provider_latency_ms' => 700 + ($e * 120),
                            'analysis_duration_ms' => 1400 + ($e * 180),
                            'token_usage' => ['prompt_tokens' => 120 + $e, 'completion_tokens' => 60 + $e, 'total_tokens' => 180 + (2 * $e)],
                        ]);
                    }
                }
            }
        }
    }

    private function seedCodeforcesSolutions($users): void
    {
        $statuses = [
            CodeforcesSolution::STATUS_COMPLETED,
            CodeforcesSolution::STATUS_COMPLETED,
            CodeforcesSolution::STATUS_FAILED,
            CodeforcesSolution::STATUS_PENDING,
        ];

        foreach ($users as $userIndex => $user) {
            $existing = CodeforcesSolution::query()->where('user_id', $user->id)->count();
            if ($existing >= self::CF_SOLUTIONS_PER_USER) {
                continue;
            }

            for ($i = $existing; $i < self::CF_SOLUTIONS_PER_USER; $i++) {
                $status = $statuses[($userIndex + $i) % count($statuses)];

                CodeforcesSolution::factory()->create([
                    'user_id' => $user->id,
                    'problem_text' => "Problem {$i}: Given an array of n integers, output the maximum subarray sum. (1 <= n <= 2*10^5)",
                    'solution_code' => $status === CodeforcesSolution::STATUS_COMPLETED
                        ? "n = int(input())\na = list(map(int, input().split()))\nbest = cur = a[0]\nfor x in a[1:]:\n    cur = max(x, cur + x)\n    best = max(best, cur)\nprint(best)"
                        : null,
                    'solution_language' => $i % 2 === 0 ? 'python' : 'cpp',
                    'status' => $status,
                    'explanation' => $status === CodeforcesSolution::STATUS_COMPLETED
                        ? 'Classic Kadane: keep the best subarray ending at each index in O(n).'
                        : null,
                    'error_message' => $status === CodeforcesSolution::STATUS_FAILED
                        ? 'AI provider timed out while generating the solution.'
                        : null,
                ]);
            }
        }
    }

    private function seedSubmissions($users): void
    {
        $problems = Problem::query()->get();
        if ($problems->isEmpty()) {
            return;
        }

        $verdicts = ['accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error'];

        foreach ($users as $userIndex => $user) {
            foreach ($problems as $problemIndex => $problem) {
                Submission::query()->updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'problem_id' => $problem->id,
                        'language' => $userIndex % 2 === 0 ? 'python' : 'cpp',
                    ],
                    [
                        'code' => $userIndex % 2 === 0 ? 'print(sum(map(int, input().split())))' : '#include <bits/stdc++.h>',
                        'verdict' => $verdicts[($userIndex + $problemIndex) % count($verdicts)],
                        'judge_meta' => ['seeded' => 'heavy'],
                    ]
                );
            }
        }
    }
}
