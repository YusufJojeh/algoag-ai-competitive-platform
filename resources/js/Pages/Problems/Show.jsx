import { Link, useForm, usePage } from '@inertiajs/react';

import AppLayout from '@/components/layout/AppLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUiLocale } from '@/lib/ui-locale';

export default function ProblemsShow() {
    const { problem, contest } = usePage().props;
    const { locale, isRtl } = useUiLocale();
    const { data, setData, post, processing, errors } = useForm({
        problem_id: problem?.id,
        contest_id: contest?.id ?? null,
        language: 'cpp',
        code: '',
    });
    const assistantPrompt = encodeURIComponent(`${problem?.title ?? ''}\n\n${problem?.statement ?? ''}`.trim());

    const copy = {
        badge: locale === 'ar' ? 'تفاصيل المسألة' : 'Problem detail',
        description: locale === 'ar'
            ? 'راجع نص المسألة، ثم استخدم المساعد لتحديد الموضوع أو فحص فكرتك قبل طلب الحل الكامل.'
            : 'Review the statement, then use the assistant to identify the topic or validate your idea before requesting the full solution.',
        askAssistant: locale === 'ar' ? 'اسأل المساعد عن هذه المسألة' : 'Ask the assistant about this problem',
        allProblems: locale === 'ar' ? 'كل المسائل' : 'All problems',
        difficulty: locale === 'ar' ? 'الصعوبة' : 'Difficulty',
        time: locale === 'ar' ? 'الوقت' : 'Time',
        memory: locale === 'ar' ? 'الذاكرة' : 'Memory',
        submitTitle: locale === 'ar' ? 'إرسال حل' : 'Submit a solution',
        contestSubmit: locale === 'ar' ? 'الإرسال ضمن المسابقة:' : 'Submitting in contest:',
        localJudgeNote: locale === 'ar'
            ? 'ينفذ حلك محليا على حالات الاختبار الرسمية ثم تظهر النتيجة. تشغيل محلي فقط، ويلزم عزل آمن قبل الإنتاج.'
            : 'Your solution is run locally against the official test cases and graded. Local dev only; sandboxing is required before production.',
        language: locale === 'ar' ? 'اللغة' : 'Language',
        code: locale === 'ar' ? 'الكود' : 'Code',
        submit: locale === 'ar' ? 'إرسال الحل' : 'Submit solution',
    };

    return (
        <AppLayout
            currentPath="/problems"
            badge={copy.badge}
            title={problem?.title}
            description={copy.description}
            actions={(
                <>
                    <Button asChild variant="soft" size="sm">
                        <Link href={`/assistant?prompt=${assistantPrompt}`}>{copy.askAssistant}</Link>
                    </Button>
                    <Button asChild variant="surface" size="sm">
                        <Link href="/problems">{copy.allProblems}</Link>
                    </Button>
                </>
            )}
            contentClassName="px-6 py-6"
        >
            <div className="mx-auto flex max-w-5xl flex-col gap-6" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="subtle">{copy.difficulty}: {problem?.difficulty}</Badge>
                    <Badge variant="subtle">{copy.time}: {problem?.time_limit_ms} ms</Badge>
                    <Badge variant="subtle">{copy.memory}: {problem?.memory_limit_mb} MB</Badge>
                    {(problem?.tags ?? []).map((tag) => (
                        <Badge key={tag.id} variant="app">{tag.name}</Badge>
                    ))}
                </div>

                <Card>
                    <CardContent className="whitespace-pre-wrap p-6 text-sm leading-7 text-slate-200">
                        {problem?.statement}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{copy.submitTitle}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {contest && (
                            <Alert className="mb-4 border-cyan-400/20 bg-cyan-400/10">
                                <AlertDescription>
                                    <span>{copy.contestSubmit}</span>{' '}
                                    <Link href={`/arena/${contest.slug}`} className="font-medium text-cyan-100 underline">
                                        {contest.title}
                                    </Link>
                                </AlertDescription>
                            </Alert>
                        )}

                        <p className="mb-4 text-sm text-[var(--app-muted)]">{copy.localJudgeNote}</p>

                        <form
                            className="flex flex-col gap-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                post('/submissions');
                            }}
                        >
                            <label className="block">
                                <Label htmlFor="submission-language">{copy.language}</Label>
                                <select
                                    id="submission-language"
                                    value={data.language}
                                    onChange={(event) => setData('language', event.target.value)}
                                    className="mt-2 w-full rounded-[24px] border border-[var(--app-border)] bg-slate-950/55 px-4 py-3 text-sm text-[var(--app-foreground)] outline-none transition focus:border-[var(--app-border-strong)] focus:ring-4 focus:ring-cyan-400/10"
                                >
                                    <option value="cpp">C++</option>
                                    <option value="python">Python</option>
                                </select>
                            </label>

                            <label className="block">
                                <Label htmlFor="submission-code">{copy.code}</Label>
                                <Textarea
                                    id="submission-code"
                                    value={data.code}
                                    onChange={(event) => setData('code', event.target.value)}
                                    rows={12}
                                    className="mt-2 font-mono"
                                    dir="ltr"
                                />
                                {errors.code && <p className="mt-2 text-sm text-rose-300">{errors.code}</p>}
                            </label>

                            <div>
                                <Button type="submit" variant="lavender" disabled={processing || !data.code.trim()}>
                                    {copy.submit}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
