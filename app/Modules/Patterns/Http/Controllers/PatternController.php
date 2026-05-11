<?php

namespace App\Modules\Patterns\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\Content\Exceptions\ContentNotFoundException;
use App\Services\Content\PatternLibraryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatternController extends Controller
{
    public function __construct(
        protected PatternLibraryService $library
    ) {}

    public function index(Request $request): Response
    {
        $filters = [
            'q' => (string) $request->query('q', ''),
            'status' => (string) $request->query('status', 'published'),
            'tag' => (string) $request->query('tag', ''),
            'per_page' => (int) $request->query('per_page', 15),
        ];

        $paginator = $this->library->listPatterns($filters);

        $patterns = $paginator->through(function ($p) {
            return [
                'pattern_id' => $p->pattern_id,
                'status' => $p->status,
                'title' => [
                    'ar' => $p->title_ar ?? '',
                    'en' => $p->title_en ?? '',
                ],
                'summary' => [
                    'ar' => $p->summary_ar ?? '',
                    'en' => $p->summary_en ?? '',
                ],
                'analytics_tags' => $p->analytics_tags ?? [],
                'href' => route('patterns.show', ['pattern' => $p->pattern_id]),
            ];
        });

        $appName = (string) config('app.name', 'AlgoAG');

        return Inertia::render('Patterns/Index', [
            'patterns' => $patterns->items(),
            'pagination' => [
                'current_page' => $patterns->currentPage(),
                'last_page' => $patterns->lastPage(),
                'per_page' => $patterns->perPage(),
                'total' => $patterns->total(),
            ],
            'filters' => [
                'q' => $filters['q'],
                'status' => $filters['status'],
                'tag' => $filters['tag'],
            ],
            'filter_tags' => $this->library->listPublishedAnalyticsTags(),
            'meta' => [
                'title' => 'مكتبة الأنماط — '.$appName,
                'description' => 'تصفح أنماط الخوارزميات والتقنيات الشائعة في المسابقات البرمجية.',
            ],
        ]);
    }

    public function show(string $pattern): Response
    {
        try {
            $detail = $this->library->getPatternDetail($pattern);
        } catch (ContentNotFoundException) {
            abort(404);
        }

        $dto = $detail['pattern'];
        $titleAr = is_array($dto['title'] ?? null) ? (string) ($dto['title']['ar'] ?? '') : '';
        $titleEn = is_array($dto['title'] ?? null) ? (string) ($dto['title']['en'] ?? '') : '';
        $summaryAr = is_array($dto['summary'] ?? null) ? (string) ($dto['summary']['ar'] ?? '') : '';
        $appName = (string) config('app.name', 'AlgoAG');
        $canonical = route('patterns.show', ['pattern' => $pattern], true);

        return Inertia::render('Patterns/Show', [
            'pattern' => $detail['pattern'],
            'related_patterns' => $detail['related_patterns'],
            'representative_problems' => $detail['representative_problems'],
            'meta' => [
                'title' => ($titleAr !== '' ? $titleAr : $titleEn).' — '.$appName,
                'description' => $summaryAr !== '' ? mb_substr($summaryAr, 0, 160) : ($titleEn !== '' ? $titleEn : $appName),
                'canonical' => $canonical,
            ],
        ]);
    }
}
