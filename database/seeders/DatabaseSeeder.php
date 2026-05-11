<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\Tag;
use App\Models\User;
use App\Modules\Problems\Models\Problem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $demoUser = User::query()->updateOrCreate(
            ['email' => 'demo@example.com'],
            [
                'name' => 'Demo User',
                'password' => Hash::make('password'),
            ]
        );
        // is_admin is not mass-assignable; set directly to prevent privilege escalation via request data.
        if (! $demoUser->is_admin) {
            $demoUser->is_admin = true;
            $demoUser->save();
        }

        $arrays = Tag::query()->firstOrCreate(
            ['slug' => 'arrays'],
            ['name' => 'Arrays']
        );
        $graphs = Tag::query()->firstOrCreate(
            ['slug' => 'graphs'],
            ['name' => 'Graphs']
        );

        $p1 = Problem::query()->firstOrCreate(
            ['slug' => 'sum-two-numbers'],
            [
                'title' => 'جمع عددين',
                'statement' => "اقرأ عددين صحيحين a و b من السطر الأول.\n\nأخرج a + b.",
                'difficulty' => 'easy',
                'time_limit_ms' => 1000,
                'memory_limit_mb' => 256,
            ]
        );
        $p1->tags()->syncWithoutDetaching([$arrays->id]);

        $p2 = Problem::query()->firstOrCreate(
            ['slug' => 'grid-bfs-intro'],
            [
                'title' => 'مقدمة BFS على شبكة',
                'statement' => "شبكة n×m من الخلايا '.' و '#'.\n\nابحث عن أقصر مسار من البداية إلى النهاية (حركة 4 اتجاهات).",
                'difficulty' => 'medium',
                'time_limit_ms' => 2000,
                'memory_limit_mb' => 256,
            ]
        );
        $p2->tags()->syncWithoutDetaching([$graphs->id]);

        $course = Course::query()->firstOrCreate(
            ['slug' => 'intro-algorithms'],
            [
                'title' => 'مقدمة في الخوارزميات',
                'description' => 'مسار قصير يغطي التعقيد والبحث والفرز.',
            ]
        );

        if ($course->lessons()->count() === 0) {
            Lesson::query()->create([
                'course_id' => $course->id,
                'title' => 'الترتيب الزمني Big-O',
                'position' => 1,
                'body' => "الترتيب الزمني يصف نمو وقت التشغيل مع حجم المدخلات n.\n\nأمثلة: O(1)، O(n)، O(n log n)، O(n²).",
            ]);
            Lesson::query()->create([
                'course_id' => $course->id,
                'title' => 'البحث الثنائي',
                'position' => 2,
                'body' => 'على مصفوفة مرتبة يمكن البحث عن عنصر في O(log n) بمقارنة العنصر الأوسط والتكرار على نصف المصفوفة.',
            ]);
        }
    }
}
