import { Link, usePage } from '@inertiajs/react';

import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';

export default function CoursesShow() {
    const { course } = usePage().props;
    const { locale, isRtl } = useUiLocale();

    return (
        <AppLayout
            currentPath="/courses"
            badge={locale === 'ar' ? 'خطة تعلم' : 'Learning plan'}
            title={course?.title}
            description={course?.description || (locale === 'ar' ? 'انتقل بين الدروس ثم عد إلى المساعد للتطبيق أو مراجعة الفكرة.' : 'Move through the lessons, then return to the assistant for practice or idea review.')}
            actions={(
                <>
                    <Button asChild variant="soft" size="sm">
                        <Link href="/assistant">{locale === 'ar' ? 'تطبيق مع المساعد' : 'Practice with the assistant'}</Link>
                    </Button>
                    <Button asChild variant="surface" size="sm">
                        <Link href="/courses">{locale === 'ar' ? 'كل المسارات' : 'All tracks'}</Link>
                    </Button>
                </>
            )}
            contentClassName="px-6 py-6"
        >
            <div className="mx-auto max-w-5xl space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
                <ol className="space-y-6">
                    {(course?.lessons || []).map((lesson) => (
                        <li key={lesson.id} className="rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-5 text-slate-200">
                            <span className="font-medium text-cyan-200">{lesson.title}</span>
                            {lesson.description ? <p className="mt-2 text-sm text-[var(--app-muted)]">{lesson.description}</p> : null}
                            {lesson.video_url ? (
                                <a className="mt-3 inline-flex text-sm text-cyan-200 underline" href={lesson.video_url} target="_blank" rel="noreferrer">
                                    {locale === 'ar' ? 'فتح الفيديو' : 'Open video'}
                                </a>
                            ) : null}
                            <div className="mt-3 whitespace-pre-wrap rounded-[22px] border border-[var(--app-border)] bg-slate-950/55 p-4 text-sm leading-7 text-slate-300">
                                {lesson.content ?? lesson.body}
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </AppLayout>
    );
}
