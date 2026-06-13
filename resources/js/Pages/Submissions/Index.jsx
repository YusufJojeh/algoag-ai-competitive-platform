import { Link, usePage } from '@inertiajs/react';

import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';
import { verdictLabel, verdictTone } from '@/lib/verdicts';

export default function SubmissionsIndex() {
    const { submissions = [], flash } = usePage().props;
    const { locale, isRtl } = useUiLocale();

    return (
        <AppLayout
            currentPath="/submissions"
            badge={locale === 'ar' ? 'سجل التدريب' : 'Practice log'}
            title={locale === 'ar' ? 'إرسالاتك ومراجعاتك الأخيرة' : 'Your latest submissions and reviews'}
            description={locale === 'ar'
                ? 'كل إرسال يُحكَم محلياً على حالات الاختبار الرسمية. اضغط على إرسال لعرض نتائج الحالات.'
                : 'Each submission is judged locally against the official test cases. Open one to see per-case results.'}
            actions={(
                <Button asChild variant="soft" size="sm">
                    <Link href="/problems">{locale === 'ar' ? 'اذهب إلى المسائل' : 'Go to problems'}</Link>
                </Button>
            )}
            contentClassName="px-6 py-6"
        >
            <div className="mx-auto max-w-5xl space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
                {flash?.message && (
                    <div className="rounded-[22px] border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{flash.message}</div>
                )}
                {submissions.length === 0 ? (
                    <div className="rounded-[30px] border border-dashed border-[var(--app-border)] bg-slate-950/35 px-6 py-14 text-center">
                        <p className="text-lg font-semibold text-[var(--app-foreground)]">{locale === 'ar' ? 'لا توجد إرسالات بعد' : 'No submissions yet'}</p>
                        <p className="mt-2 text-sm text-[var(--app-muted)]">
                            {locale === 'ar' ? 'افتح مسألة من بنك المسائل وأرسل محاولة جديدة لتظهر هنا.' : 'Open a problem from the bank and submit a new attempt to populate this log.'}
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {submissions.map((s) => (
                            <li key={s.id} className="rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-5 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs text-slate-500">{s.created_at}</span>
                                    <Link href={`/submissions/${s.id}`} className="text-xs text-cyan-200 hover:underline">
                                        #{s.id}
                                    </Link>
                                </div>
                                <p className="mt-2 text-slate-200">
                                    {s.problem ? (
                                        <Link href={`/problems/${s.problem.id}`} className="text-cyan-200 hover:underline">
                                            {s.problem.title}
                                        </Link>
                                    ) : (
                                        locale === 'ar' ? 'بدون مسألة مرتبطة' : 'No linked problem'
                                    )}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <Badge variant={verdictTone(s.verdict)}>{verdictLabel(s.verdict, locale)}</Badge>
                                    <Badge variant="subtle">{s.language}</Badge>
                                    {s.runtime_ms != null && <Badge variant="subtle">{s.runtime_ms} ms</Badge>}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}
