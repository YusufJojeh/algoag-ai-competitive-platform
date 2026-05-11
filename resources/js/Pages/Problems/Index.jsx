import { Link, usePage } from '@inertiajs/react';

import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';

export default function ProblemsIndex() {
    const { problems = [] } = usePage().props;
    const { locale, isRtl } = useUiLocale();

    return (
        <AppLayout
            currentPath="/problems"
            badge={locale === 'ar' ? 'بنك المسائل' : 'Problem bank'}
            title={locale === 'ar' ? 'استعرض المسائل القابلة للتدريب' : 'Browse problems you can train on'}
            description={locale === 'ar'
                ? 'انتقل من التصفح إلى الجلسة التعليمية بسرعة: افتح المسألة، راجع الموضوعات، ثم استخدم المساعد لفحص الفكرة أو طلب التلميحات.'
                : 'Move quickly from browsing into guided practice: open a problem, review the topic, then use the assistant for hints or idea validation.'}
            actions={(
                <>
                    <Button asChild variant="soft" size="sm">
                        <Link href="/assistant">{locale === 'ar' ? 'افتح المساعد' : 'Open assistant'}</Link>
                    </Button>
                    <Button asChild variant="surface" size="sm">
                        <Link href="/patterns">{locale === 'ar' ? 'الموضوعات' : 'Topics'}</Link>
                    </Button>
                </>
            )}
            contentClassName="px-6 py-6"
        >
            <div className="mx-auto max-w-5xl space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
                {problems.length === 0 ? (
                    <div className="rounded-[30px] border border-dashed border-[var(--app-border)] bg-slate-950/35 px-6 py-14 text-center">
                        <p className="text-lg font-semibold text-[var(--app-foreground)]">{locale === 'ar' ? 'لا توجد مسائل حتى الآن' : 'No problems yet'}</p>
                        <p className="mt-2 text-sm text-[var(--app-muted)]">
                            {locale === 'ar' ? 'أضف محتوى للمسائل أو شغّل التهيئة التجريبية لملء القائمة.' : 'Add problem content or seed the demo dataset to populate this list.'}
                        </p>
                    </div>
                ) : (
                    <ul className="grid gap-4 lg:grid-cols-2">
                        {problems.map((p) => (
                            <li key={p.id}>
                                <Link
                                    href={`/problems/${p.id}`}
                                    className="block h-full rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-5 transition hover:border-[var(--app-border-strong)] hover:bg-slate-950/60"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="font-medium text-cyan-200">{p.title}</span>
                                        <Badge variant="subtle">{p.difficulty}</Badge>
                                    </div>
                                    {p.tags?.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {p.tags.map((t) => (
                                                <Badge key={t.id} variant="subtle">{t.name}</Badge>
                                            ))}
                                        </div>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}
