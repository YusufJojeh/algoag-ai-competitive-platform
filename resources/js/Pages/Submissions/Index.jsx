import { Link, usePage } from '@inertiajs/react';

import AppLayout from '@/components/layout/AppLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUiLocale } from '@/lib/ui-locale';
import { verdictLabel, verdictTone } from '@/lib/verdicts';

export default function SubmissionsIndex() {
    const { submissions = [], flash } = usePage().props;
    const { locale, isRtl } = useUiLocale();

    const copy = {
        badge: locale === 'ar' ? 'سجل التدريب' : 'Practice log',
        title: locale === 'ar' ? 'إرسالاتك ومراجعاتك الأخيرة' : 'Your latest submissions and reviews',
        description: locale === 'ar'
            ? 'كل إرسال يحكم محليا على حالات الاختبار الرسمية. افتح إرسالا لعرض نتائج الحالات.'
            : 'Each submission is judged locally against the official test cases. Open one to see per-case results.',
        problems: locale === 'ar' ? 'اذهب إلى المسائل' : 'Go to problems',
        emptyTitle: locale === 'ar' ? 'لا توجد إرسالات بعد' : 'No submissions yet',
        emptyDescription: locale === 'ar'
            ? 'افتح مسألة من بنك المسائل وأرسل محاولة جديدة لتظهر هنا.'
            : 'Open a problem from the bank and submit a new attempt to populate this log.',
        noProblem: locale === 'ar' ? 'بدون مسألة مرتبطة' : 'No linked problem',
    };

    return (
        <AppLayout
            currentPath="/submissions"
            badge={copy.badge}
            title={copy.title}
            description={copy.description}
            actions={(
                <Button asChild variant="soft" size="sm">
                    <Link href="/problems">{copy.problems}</Link>
                </Button>
            )}
            contentClassName="px-6 py-6"
        >
            <div className="mx-auto flex max-w-5xl flex-col gap-4" dir={isRtl ? 'rtl' : 'ltr'}>
                {flash?.message && (
                    <Alert className="border-emerald-400/20 bg-emerald-400/10">
                        <AlertDescription>{flash.message}</AlertDescription>
                    </Alert>
                )}

                {submissions.length === 0 ? (
                    <Card className="border-dashed bg-slate-950/35">
                        <CardContent className="px-6 py-14 text-center">
                            <p className="text-lg font-semibold text-[var(--app-foreground)]">{copy.emptyTitle}</p>
                            <p className="mt-2 text-sm text-[var(--app-muted)]">{copy.emptyDescription}</p>
                        </CardContent>
                    </Card>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {submissions.map((submission) => (
                            <li key={submission.id}>
                                <Card>
                                    <CardContent className="p-5 text-sm">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs text-[var(--app-muted)]">{submission.created_at}</span>
                                            <Link href={`/submissions/${submission.id}`} className="text-xs text-cyan-200 hover:underline">
                                                #{submission.id}
                                            </Link>
                                        </div>
                                        <p className="mt-2 text-slate-200">
                                            {submission.problem ? (
                                                <Link href={`/problems/${submission.problem.id}`} className="text-cyan-200 hover:underline">
                                                    {submission.problem.title}
                                                </Link>
                                            ) : (
                                                copy.noProblem
                                            )}
                                        </p>
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <Badge variant={verdictTone(submission.verdict)}>{verdictLabel(submission.verdict, locale)}</Badge>
                                            <Badge variant="subtle">{submission.language}</Badge>
                                            {submission.runtime_ms != null && <Badge variant="subtle">{submission.runtime_ms} ms</Badge>}
                                        </div>
                                    </CardContent>
                                </Card>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}
