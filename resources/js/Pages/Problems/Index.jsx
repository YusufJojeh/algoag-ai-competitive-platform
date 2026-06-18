import { Link, usePage } from '@inertiajs/react';

import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUiLocale } from '@/lib/ui-locale';

const copy = {
    en: {
        badge: 'Problem bank',
        title: 'Browse problems you can train on',
        description: 'Move quickly from browsing into guided practice: open a problem, review the topic, then use the assistant for hints or idea validation.',
        assistant: 'Open assistant',
        topics: 'Topics',
        emptyTitle: 'No problems yet',
        emptyDescription: 'Add problem content or seed the demo dataset to populate this list.',
        published: 'Published',
        created: 'Created',
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
        extreme: 'Extreme',
    },
    ar: {
        badge: 'بنك المسائل',
        title: 'استعرض المسائل القابلة للتدريب',
        description: 'انتقل من التصفح إلى التدريب الموجه بسرعة: افتح المسألة، راجع الموضوعات، ثم استخدم المساعد للتلميحات أو فحص الفكرة.',
        assistant: 'افتح المساعد',
        topics: 'الموضوعات',
        emptyTitle: 'لا توجد مسائل حتى الآن',
        emptyDescription: 'أضف محتوى للمسائل أو شغل التهيئة التجريبية لملء القائمة.',
        published: 'نشرت',
        created: 'أنشئت',
        easy: 'سهل',
        medium: 'متوسط',
        hard: 'صعب',
        extreme: 'شديدة',
    },
};

export default function ProblemsIndex() {
    const { problems = [], filters = {} } = usePage().props;
    const { locale, isRtl } = useUiLocale();
    const t = copy[locale];

    return (
        <AppLayout
            currentPath="/problems"
            badge={t.badge}
            title={t.title}
            description={filters.topic ? `${t.description} ${locale === 'ar' ? 'الموضوع:' : 'Topic:'} ${filters.topic.name}` : t.description}
            actions={(
                <>
                    <Button asChild variant="soft" size="sm">
                        <Link href="/assistant">{t.assistant}</Link>
                    </Button>
                    <Button asChild variant="surface" size="sm">
                        <Link href="/patterns">{t.topics}</Link>
                    </Button>
                </>
            )}
            contentClassName="px-6 py-6"
        >
            <div className="mx-auto flex max-w-5xl flex-col gap-4" dir={isRtl ? 'rtl' : 'ltr'}>
                {problems.length === 0 ? (
                    <Card className="border-dashed bg-slate-950/35">
                        <CardContent className="px-6 py-14 text-center">
                            <p className="text-lg font-semibold text-[var(--app-foreground)]">{t.emptyTitle}</p>
                            <p className="mt-2 text-sm text-[var(--app-muted)]">{t.emptyDescription}</p>
                        </CardContent>
                    </Card>
                ) : (
                    <ul className="grid gap-4 lg:grid-cols-2">
                        {problems.map((problem) => (
                            <li key={problem.id}>
                                <Link href={`/problems/${problem.id}`} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70">
                                    <Card className="h-full transition hover:border-[var(--app-border-strong)] hover:bg-slate-950/60">
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <span className="font-medium text-cyan-200">{problem.title}</span>
                                                <Badge variant={difficultyVariant(problem.difficulty)}>{t[problem.difficulty] ?? problem.difficulty}</Badge>
                                            </div>
                                            <p className="mt-3 text-xs text-[var(--app-muted)]">{problemTime(problem, t)}</p>
                                            {problem.tags?.length > 0 && (
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {problem.tags.map((tag) => (
                                                        <Badge key={tag.id} variant="subtle">{tag.name}</Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}

function problemTime(problem, t) {
    const label = problem.time_label === 'published' ? t.published : t.created;
    const value = problem.time_at;

    return `${label}: ${formatDate(value)}`;
}

function formatDate(value) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function difficultyVariant(difficulty) {
    if (difficulty === 'easy') return 'success';
    if (difficulty === 'medium') return 'warning';
    if (difficulty === 'hard') return 'danger';
    if (difficulty === 'extreme') return 'violet';

    return 'subtle';
}
