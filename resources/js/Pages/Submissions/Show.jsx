import { Link, usePage } from '@inertiajs/react';

import AppLayout from '@/components/layout/AppLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        code: 'الكود المرسل',
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
            <div className="mx-auto flex max-w-4xl flex-col gap-6" dir={isRtl ? 'rtl' : 'ltr'}>
                <Card>
                    <CardContent className="flex flex-wrap items-center gap-3 p-5">
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
                    </CardContent>
                </Card>

                {submission?.message && (
                    <Alert className="bg-slate-950/35">
                        <AlertDescription>{submission.message}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>{t.cases}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {cases.length === 0 ? (
                            <p className="text-sm text-[var(--app-muted)]">{t.noCases}</p>
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {cases.map((testCase, index) => (
                                    <li key={index}>
                                        <Card className="bg-slate-950/55">
                                            <CardContent className="p-4">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-medium text-[var(--app-foreground)]">#{(testCase.index ?? index) + 1}</span>
                                                    <Badge variant={verdictTone(testCase.verdict)}>{verdictLabel(testCase.verdict, locale)}</Badge>
                                                    <Badge variant="subtle">{testCase.is_sample ? t.sample : t.hidden}</Badge>
                                                    {testCase.runtime_ms != null && <span className="text-xs text-[var(--app-muted)]">{testCase.runtime_ms} ms</span>}
                                                </div>
                                                {testCase.is_sample && (
                                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                        <div>
                                                            <p className="mb-1 text-xs text-[var(--app-muted)]">{t.input}</p>
                                                            <pre className="overflow-x-auto rounded-xl bg-slate-950/70 p-3 font-mono text-xs text-slate-200" dir="ltr">{testCase.input}</pre>
                                                        </div>
                                                        <div>
                                                            <p className="mb-1 text-xs text-[var(--app-muted)]">{t.expected}</p>
                                                            <pre className="overflow-x-auto rounded-xl bg-slate-950/70 p-3 font-mono text-xs text-slate-200" dir="ltr">{testCase.expected_output}</pre>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t.code}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="overflow-x-auto rounded-xl bg-slate-950/70 p-4 font-mono text-xs text-slate-200" dir="ltr">{submission?.code}</pre>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
