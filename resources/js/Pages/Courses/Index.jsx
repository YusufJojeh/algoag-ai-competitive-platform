import { Link, usePage } from '@inertiajs/react';

import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';

export default function CoursesIndex() {
    const { courses = [] } = usePage().props;
    const { locale, isRtl } = useUiLocale();

    return (
        <AppLayout
            currentPath="/courses"
            badge={locale === 'ar' ? 'مسارات التعلم' : 'Learning tracks'}
            title={locale === 'ar' ? 'تعلّم حسب الموضوع لا حسب الفوضى' : 'Learn by topic, not by chaos'}
            description={locale === 'ar'
                ? 'هذه المسارات تنظم الرحلة بين الموضوعات والمسائل، ثم تنقل المستخدم مباشرة إلى المساعد عند الحاجة.'
                : 'These tracks organize the path between topics and problems, then hand the learner off to the assistant when needed.'}
            actions={(
                <Button asChild variant="soft" size="sm">
                    <Link href="/assistant">{locale === 'ar' ? 'ابدأ جلسة جديدة' : 'Start a new session'}</Link>
                </Button>
            )}
            contentClassName="px-6 py-6"
        >
            <div className="mx-auto max-w-5xl space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
                {courses.length === 0 ? (
                    <div className="rounded-[30px] border border-dashed border-[var(--app-border)] bg-slate-950/35 px-6 py-14 text-center">
                        <p className="text-lg font-semibold text-[var(--app-foreground)]">{locale === 'ar' ? 'لا توجد مسارات بعد' : 'No learning tracks yet'}</p>
                        <p className="mt-2 text-sm text-[var(--app-muted)]">
                            {locale === 'ar' ? 'أضف محتوى للمسارات أو فعّل بيانات العرض التجريبية.' : 'Add course content or enable the demo data set.'}
                        </p>
                    </div>
                ) : (
                    <ul className="grid gap-4 lg:grid-cols-2">
                        {courses.map((c) => (
                            <li key={c.id}>
                                <Link
                                    href={`/courses/${c.id}`}
                                    className="block h-full rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-5 transition hover:border-[var(--app-border-strong)] hover:bg-slate-950/60"
                                >
                                    <span className="font-medium text-cyan-200">{c.title}</span>
                                    {c.description && <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">{c.description}</p>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}
