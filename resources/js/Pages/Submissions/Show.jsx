import { Link, usePage } from '@inertiajs/react';

import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';
import { verdictLabel, verdictTone } from '@/lib/verdicts';

const copy = {
    en: {
        badge: 'Submission',
        title: 'Submission detail',
        verdict: 'Verdict',
        runtime: 'Runtime',
        language: 'Language',
        problem: 'Problem',
        noProblem: 'No linked problem',
        cases: 'Test cases',
        noCases: 'No per-case results.',
        sample: 'Sample',
        hidden: 'Hidden',
        input: 'Input',
        expected: 'Expected output',
        code: 'Submitted code',
        back: 'All submissions',
    },
    ar: {
        badge: 'إرسال',
        title: 'تفاصيل الإرسال',
        verdict: 'النتيجة',
        runtime: 'زمن التنفيذ',
        language: 'اللغة',
        problem: 'المسألة',
        noProblem: 'بدون مسألة مرتبطة',
        cases: 'حالات الاختبار',
        noCases: 'لا توجد نتائج لكل حالة.',
        sample: 'نموذجية',
        hidden: 'مخفية',
        input: 'المدخلات',
        expected: 'المخرجات المتوقعة',
        code: 'الكود المُرسَل',
        back: 'كل الإرسالات',
    },
};

export default function SubmissionsShow() {
    const { submission } = usePage().props;
    const { locale, isRtl } = useUiLocale();
    const t = copy[locale];
    const cases = submission?.cases ?? [];

    return (
        <AppLayout
            currentPath="/submissions"
            badge={t.badge}
            title={`${t.title} #${submission?.id ?? ''}`}
            description={submission?.created_at}
            actions={(
                <Button asChild variant="surface" size="sm">
                    <Link href="/submissions">{t.back}</Link>
                </Button>
            )}
            contentClassName="px-6 py-6"
        >
            <div className="mx-auto max-w-4xl space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="flex flex-wrap items-center gap-3 rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-5">
                    <Badge variant={verdictTone(submission?.verdict)}>
                        {verdictLabel(submission?.verdict, locale)}
                    </Badge>
                    <Badge variant="subtle">{t.language}: {submission?.language}</Badge>
                    {submission?.runtime_ms != null && (
                        <Badge variant="subtle">{t.runtime}: {submission.runtime_ms} ms</Badge>
                    )}
                    <span className="text-sm text-[var(--app-muted)]">
                        {t.problem}:{' '}
                        {submission?.problem ? (
                            <Link href={`/problems/${submission.problem.id}`} className="text-cyan-200 hover:underline">
                                {submission.problem.title}
                            </Link>
                        ) : (
                            t.noProblem
                        )}
                    </span>
                </div>

                {submission?.message && (
                    <div className="rounded-[22px] border border-[var(--app-border)] bg-slate-950/35 p-4 text-sm text-[var(--app-muted)]">
                        {submission.message}
                    </div>
                )}

                <section className="rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-5">
                    <h2 className="mb-3 text-lg font-semibold text-[var(--app-foreground)]">{t.cases}</h2>
                    {cases.length === 0 ? (
                        <p className="text-sm text-[var(--app-muted)]">{t.noCases}</p>
                    ) : (
                        <ul className="space-y-3">
                            {cases.map((c, i) => (
                                <li key={i} className="rounded-2xl border border-[var(--app-border)] bg-slate-950/55 p-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-medium text-[var(--app-foreground)]">#{(c.index ?? i) + 1}</span>
                                        <Badge variant={verdictTone(c.verdict)}>{verdictLabel(c.verdict, locale)}</Badge>
                                        <Badge variant="subtle">{c.is_sample ? t.sample : t.hidden}</Badge>
                                        {c.runtime_ms != null && <span className="text-xs text-[var(--app-muted)]">{c.runtime_ms} ms</span>}
                                    </div>
                                    {c.is_sample && (
                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                            <div>
                                                <p className="mb-1 text-xs text-[var(--app-muted)]">{t.input}</p>
                                                <pre className="overflow-x-auto rounded-xl bg-slate-950/70 p-3 font-mono text-xs text-slate-200" dir="ltr">{c.input}</pre>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-xs text-[var(--app-muted)]">{t.expected}</p>
                                                <pre className="overflow-x-auto rounded-xl bg-slate-950/70 p-3 font-mono text-xs text-slate-200" dir="ltr">{c.expected_output}</pre>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-5">
                    <h2 className="mb-3 text-lg font-semibold text-[var(--app-foreground)]">{t.code}</h2>
                    <pre className="overflow-x-auto rounded-xl bg-slate-950/70 p-4 font-mono text-xs text-slate-200" dir="ltr">{submission?.code}</pre>
                </section>
            </div>
        </AppLayout>
    );
}
