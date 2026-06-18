import { useEffect, useRef, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Check, Copy } from 'lucide-react';

import AppLayout from '@/components/layout/AppLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUiLocale } from '@/lib/ui-locale';

const TABS = [
    { id: 'problem', label: { ar: 'المسألة', en: 'Problem' } },
    { id: 'code', label: { ar: 'الحل', en: 'Code' } },
    { id: 'explanation', label: { ar: 'الشرح', en: 'Explanation' } },
    { id: 'tests', label: { ar: 'الاختبارات', en: 'Tests' } },
    { id: 'judge', label: { ar: 'الحكم', en: 'Judge' } },
    { id: 'algorithm', label: { ar: 'الخوارزمية والتطويرات', en: 'Algorithm notes' } },
];

const stageLabel = (stage, locale = 'ar') => {
    const labels = {
        queued: { ar: 'بانتظار العامل', en: 'Waiting for worker' },
        parsing: { ar: 'تحليل نص المسألة', en: 'Parsing statement' },
        generating_code: { ar: 'توليد الحل', en: 'Generating solution' },
        generating_explanation: { ar: 'توليد الشرح', en: 'Generating explanation' },
        generating_tests: { ar: 'توليد الاختبارات', en: 'Generating tests' },
        judging: { ar: 'تشغيل الحكم', en: 'Running judge' },
        generating_breakdown: { ar: 'توليد تحليل الخوارزمية', en: 'Generating algorithm notes' },
        completed: { ar: 'اكتمل', en: 'Completed' },
        failed: { ar: 'فشل', en: 'Failed' },
    };

    return labels[stage]?.[locale] ?? stage ?? (locale === 'ar' ? 'قيد المعالجة' : 'Processing');
};

function localizedText(translations, locale, fallback = '') {
    if (translations && typeof translations === 'object') {
        const exact = translations[locale];
        if (typeof exact === 'string' && exact.trim() !== '') return exact;

        const other = translations[locale === 'ar' ? 'en' : 'ar'];
        if (typeof other === 'string' && other.trim() !== '') return other;
    }

    return fallback || '';
}

function localizedParsedProblem(solution, locale) {
    const candidate = solution?.parsed_problem_translations?.[locale];
    if (candidate && typeof candidate === 'object') {
        return {
            ...(solution?.parsed_problem || {}),
            ...candidate,
            examples: solution?.parsed_problem?.examples || candidate.examples || [],
        };
    }

    return solution?.parsed_problem || {};
}

export default function CodeforcesResult() {
    const { solution, statusPollUrl, auth } = usePage().props;
    const { locale, isRtl } = useUiLocale();
    const [activeTab, setActiveTab] = useState('problem');
    const [pollStage, setPollStage] = useState(solution?.progress_stage ?? null);
    const [codeCopied, setCodeCopied] = useState(false);
    const pollRef = useRef(null);
    const userId = auth?.user?.id;
    const ar = locale === 'ar';

    useEffect(() => {
        setCodeCopied(false);
    }, [solution?.solution_code]);

    useEffect(() => {
        if (!codeCopied) return undefined;

        const timer = setTimeout(() => setCodeCopied(false), 1800);

        return () => clearTimeout(timer);
    }, [codeCopied]);

    const copySolutionCode = async () => {
        const code = solution?.solution_code || '';
        if (!code) return;

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(code);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = code;
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }

            setCodeCopied(true);
        } catch {
            setCodeCopied(false);
        }
    };

    useEffect(() => {
        if (typeof window === 'undefined' || !window.Echo || !solution?.id || !userId) return undefined;
        if (!['pending', 'processing'].includes(solution.status)) return undefined;

        const channelName = `codeforces-solutions.${userId}`;
        const channel = window.Echo.private(channelName);

        const handler = (payload) => {
            if (payload?.solutionId === solution.id && ['completed', 'failed'].includes(payload.status)) {
                router.reload();
            }
        };

        channel.listen('.solution.status', handler);

        return () => {
            window.Echo.leave(`private-${channelName}`);
        };
    }, [solution?.id, solution?.status, userId]);

    useEffect(() => {
        if (!statusPollUrl || !solution) return undefined;
        if (!['pending', 'processing'].includes(solution.status)) return undefined;

        pollRef.current = setInterval(async () => {
            try {
                const r = await fetch(statusPollUrl, {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                });
                if (!r.ok) return;
                const j = await r.json();
                if (j.progress_stage) setPollStage(j.progress_stage);
                if (['completed', 'failed'].includes(j.status)) {
                    if (pollRef.current) clearInterval(pollRef.current);
                    router.reload();
                }
            } catch {
                /* polling is best-effort */
            }
        }, 2500);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [solution?.status, statusPollUrl, solution?.id]);

    const parsed = localizedParsedProblem(solution, locale);
    const problemText = localizedText(solution?.problem_text_translations, locale, solution?.problem_text);
    const explanation = localizedText(solution?.explanation_translations, locale, solution?.explanation);
    const algorithmBreakdown = localizedText(solution?.algorithm_breakdown_translations, locale, solution?.algorithm_breakdown);
    const tests = solution?.generated_tests || [];
    const isFailed = solution?.status === 'failed';
    const isProcessing = solution?.status === 'pending' || solution?.status === 'processing';

    const text = {
        processingLead: ar ? 'جاري المعالجة في الخلفية...' : 'Processing in the background...',
        processingTail: ar ? 'سيتم تحديث الصفحة تلقائيا عند الانتهاء.' : 'The page will refresh automatically when it finishes.',
        failedLead: ar ? 'فشل الحل:' : 'Solution failed:',
        parsedProblem: ar ? 'المسألة المحللة' : 'Parsed problem',
        inputFormat: ar ? 'صيغة الإدخال:' : 'Input format:',
        outputFormat: ar ? 'صيغة الإخراج:' : 'Output format:',
        constraints: ar ? 'القيود:' : 'Constraints:',
        examples: ar ? 'أمثلة:' : 'Examples:',
        rawProblem: ar ? 'النص الأصلي للمسألة:' : 'Original problem text:',
        solutionCode: ar ? 'كود الحل' : 'Solution code',
        explanation: ar ? 'الشرح' : 'Explanation',
        judgeTitle: ar ? 'نتائج الحكم' : 'Judge results',
        judgeNote: ar
            ? 'تظهر هنا نتيجة تشغيل الحل على عينات المسألة والاختبارات المتاحة. راجع تبويب الاختبارات للمدخلات والمخرجات المتوقعة.'
            : 'This shows the solution run against official samples and available tests. Use the tests tab for inputs and expected outputs.',
        test: ar ? 'اختبار' : 'Test',
        noJudge: ar ? 'لا توجد بيانات حكم بعد.' : 'No judge data yet.',
        generatedTests: ar ? 'الاختبارات المولدة' : 'Generated tests',
        testsNote: ar
            ? 'العينات الرسمية تبقى كما هي، والاختبارات الإضافية تساعدك على تجربة الحل محليا.'
            : 'Official samples stay exact, and extra generated tests help you try the solution locally.',
        noTests: ar ? 'لا توجد اختبارات.' : 'No tests yet.',
        algorithm: ar ? 'الخوارزمية والتطويرات والفائدة' : 'Algorithm, improvements, and learning value',
        input: ar ? 'الإدخال:' : 'Input:',
        output: ar ? 'الإخراج:' : 'Output:',
        expectedOutput: ar ? 'المخرج المتوقع:' : 'Expected output:',
        language: ar ? 'اللغة:' : 'Language:',
        newProblem: ar ? 'مسألة جديدة' : 'New problem',
        solveAnother: ar ? 'حل مسألة أخرى' : 'Solve another problem',
        empty: '-',
    };

    return (
        <AppLayout
            currentPath="/solve"
            badge="Codeforces"
            title={ar ? 'نتيجة التحليل والتوليد' : 'Analysis and generation result'}
            description={ar
                ? 'المسألة والشرح والتحليل تظهر بالعربية أو الإنجليزية حسب لغة الواجهة، مع إبقاء الأمثلة والاختبارات كما هي.'
                : 'Problem text, explanation, and analysis follow the UI language, while examples and tests stay exact.'}
            actions={(
                <Button asChild variant="soft" size="sm">
                    <Link href="/solve">{text.newProblem}</Link>
                </Button>
            )}
            contentClassName="px-6 py-6"
        >
            <div className="mx-auto max-w-5xl" dir={isRtl ? 'rtl' : 'ltr'}>
                {isProcessing && (
                    <Alert className="mb-6 border-sky-500/30 bg-sky-500/10 text-sky-200">
                        <AlertDescription className="text-sky-200">
                            <strong>{text.processingLead}</strong> {stageLabel(pollStage ?? solution?.progress_stage, locale)}. {text.processingTail}
                        </AlertDescription>
                    </Alert>
                )}

                {isFailed && solution?.error_message && (
                    <Alert className="mb-6 border-red-500/30 bg-red-500/10 text-red-200">
                        <AlertDescription className="text-red-200">
                            <strong>{text.failedLead}</strong> {solution.error_message}
                        </AlertDescription>
                    </Alert>
                )}

                {(solution?.status === 'completed' || solution?.status === 'failed' || (isProcessing && solution?.problem_text)) && (
                    <div className="mb-6 flex flex-wrap gap-2 border-b border-[var(--app-border)] pb-4">
                        {TABS.map((tab) => (
                            <Button
                                key={tab.id}
                                type="button"
                                variant={activeTab === tab.id ? 'soft' : 'surface'}
                                size="sm"
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label[locale]}
                            </Button>
                        ))}
                    </div>
                )}

                {activeTab === 'problem' && (
                    <section className="space-y-4">
                        <h2 className="text-slate-300 font-medium">{text.parsedProblem}</h2>
                        {parsed.title && <p className="font-medium text-cyan-200">{parsed.title}</p>}
                        {parsed.description && (
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-slate-200 whitespace-pre-wrap">{parsed.description}</p>
                                </CardContent>
                            </Card>
                        )}
                        {parsed.input_format && (
                            <div>
                                <span className="text-slate-400 text-sm font-medium">{text.inputFormat}</span>
                                <pre className="mt-1 rounded-[22px] border border-[var(--app-border)] bg-slate-950/55 p-3 text-sm text-slate-200 whitespace-pre-wrap font-mono">{parsed.input_format}</pre>
                            </div>
                        )}
                        {parsed.output_format && (
                            <div>
                                <span className="text-slate-400 text-sm font-medium">{text.outputFormat}</span>
                                <pre className="mt-1 rounded-[22px] border border-[var(--app-border)] bg-slate-950/55 p-3 text-sm text-slate-200 whitespace-pre-wrap font-mono">{parsed.output_format}</pre>
                            </div>
                        )}
                        {parsed.constraints && (
                            <div>
                                <span className="text-slate-400 text-sm font-medium">{text.constraints}</span>
                                <p className="mt-1 text-slate-200 text-sm whitespace-pre-wrap">{parsed.constraints}</p>
                            </div>
                        )}
                        {parsed.examples?.length > 0 && (
                            <div>
                                <span className="text-slate-400 text-sm font-medium">{text.examples}</span>
                                <ul className="mt-2 space-y-3">
                                    {parsed.examples.map((ex, i) => (
                                        <li key={i}>
                                            <Card className="p-3">
                                                <span className="text-slate-500 text-xs">{text.input}</span>
                                                <pre className="text-slate-200 text-sm whitespace-pre-wrap font-mono mt-0.5">{ex.input}</pre>
                                                <span className="text-slate-500 text-xs mt-2 block">{text.output}</span>
                                                <pre className="text-slate-200 text-sm whitespace-pre-wrap font-mono mt-0.5">{ex.output}</pre>
                                            </Card>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {!parsed.title && !parsed.description && (
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-slate-400 text-sm">{text.rawProblem}</p>
                                    <p className="text-slate-200 whitespace-pre-wrap mt-2">{problemText}</p>
                                </CardContent>
                            </Card>
                        )}
                    </section>
                )}

                {activeTab === 'code' && (
                    <section>
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-slate-300 font-medium">{text.solutionCode}</h2>
                                {solution?.solution_language && (
                                    <Badge variant="subtle" className="mt-2">
                                        {text.language} {solution.solution_language === 'cpp' ? 'C++' : 'Python'}
                                    </Badge>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="soft"
                                size="sm"
                                onClick={copySolutionCode}
                                disabled={!solution?.solution_code}
                                aria-label={codeCopied ? (ar ? 'تم النسخ' : 'Copied') : (ar ? 'نسخ الكود' : 'Copy code')}
                                className="min-w-[112px]"
                            >
                                {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {codeCopied ? (ar ? 'تم النسخ' : 'Copied') : (ar ? 'نسخ الكود' : 'Copy code')}
                            </Button>
                        </div>
                        <pre className="overflow-x-auto rounded-[28px] border border-[var(--app-border)] bg-slate-950/70 p-4 text-sm">
                            <code className="font-mono whitespace-pre text-cyan-100">{solution?.solution_code || text.empty}</code>
                        </pre>
                    </section>
                )}

                {activeTab === 'explanation' && (
                    <Card>
                        <section>
                            <CardHeader>
                                <CardTitle>{text.explanation}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{explanation || text.empty}</p>
                            </CardContent>
                        </section>
                    </Card>
                )}

                {activeTab === 'judge' && (
                    <section className="space-y-4">
                        <h2 className="text-slate-300 font-medium mb-2">{text.judgeTitle}</h2>
                        <p className="text-slate-500 text-sm mb-3">{text.judgeNote}</p>
                        {solution?.run_results?.message && (
                            <Alert className="bg-slate-950/45 text-slate-200">
                                <AlertDescription className="text-slate-200">{solution.run_results.message}</AlertDescription>
                            </Alert>
                        )}
                        {solution?.run_results?.test_cases?.length > 0 && (
                            <ul className="space-y-2">
                                {solution.run_results.test_cases.map((c) => (
                                    <li key={c.index}>
                                        <Card className="p-3 text-sm">
                                            <span className="text-slate-400">{text.test} #{c.index + 1}</span>
                                            <span className="block text-amber-300 mt-1">{c.verdict}</span>
                                            {c.note && <p className="text-slate-400 mt-1">{c.note}</p>}
                                        </Card>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {!solution?.run_results && !isProcessing && <p className="text-slate-500">{text.noJudge}</p>}
                    </section>
                )}

                {activeTab === 'tests' && (
                    <section>
                        <h2 className="text-slate-300 font-medium mb-2">{text.generatedTests}</h2>
                        <p className="text-slate-500 text-sm mb-3">{text.testsNote}</p>
                        {tests.length === 0 ? (
                            <p className="text-slate-500">{text.noTests}</p>
                        ) : (
                            <div className="space-y-4">
                                {tests.map((t, i) => (
                                    <Card key={i}>
                                        <CardContent className="p-4">
                                        <span className="text-slate-500 text-xs">{text.test} #{i + 1}</span>
                                        <div className="mt-2">
                                            <span className="text-slate-400 text-xs">{text.input}</span>
                                            <pre className="mt-0.5 rounded-[18px] bg-slate-950/70 p-2 text-sm text-slate-200 whitespace-pre-wrap font-mono">{t.input}</pre>
                                        </div>
                                        <div className="mt-2">
                                            <span className="text-slate-400 text-xs">{text.expectedOutput}</span>
                                            <pre className="mt-0.5 rounded-[18px] bg-slate-950/70 p-2 text-sm text-slate-200 whitespace-pre-wrap font-mono">{t.expected_output}</pre>
                                        </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'algorithm' && (
                    <Card>
                        <section>
                            <CardHeader>
                                <CardTitle>{text.algorithm}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{algorithmBreakdown || text.empty}</p>
                            </CardContent>
                        </section>
                    </Card>
                )}

                <div className="mt-8 border-t border-[var(--app-border)] pt-6">
                    <Button asChild variant="surface">
                        <Link href="/solve">{text.solveAnother}</Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
