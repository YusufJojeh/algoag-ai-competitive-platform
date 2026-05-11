import { useState, useEffect, useRef } from 'react';
import { usePage, Link, router } from '@inertiajs/react';

import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';

const TABS = [
    { id: 'problem', label: 'المسألة' },
    { id: 'code', label: 'الحل' },
    { id: 'explanation', label: 'الشرح' },
    { id: 'tests', label: 'الاختبارات' },
    { id: 'judge', label: 'الحكم (وضع تجريبي)' },
    { id: 'algorithm', label: 'الخوارزمية والتطويرات' },
];

export default function CodeforcesResult() {
    const { solution, statusPollUrl, auth } = usePage().props;
    const { locale, isRtl } = useUiLocale();
    const [activeTab, setActiveTab] = useState('problem');
    const pollRef = useRef(null);
    const userId = auth?.user?.id;

    useEffect(() => {
        if (typeof window === 'undefined' || !window.Echo || !solution?.id || !userId) return undefined;
        if (!['pending', 'processing'].includes(solution.status)) return undefined;

        const channelName = `codeforces-solutions.${userId}`;
        const channel = window.Echo.private(channelName);

        const handler = (payload) => {
            if (
                payload?.solutionId === solution.id
                && ['completed', 'failed'].includes(payload.status)
            ) {
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
                if (['completed', 'failed'].includes(j.status)) {
                    if (pollRef.current) clearInterval(pollRef.current);
                    router.reload();
                }
            } catch {
                /* ignore */
            }
        }, 2500);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [solution?.status, statusPollUrl, solution?.id]);

    const parsed = solution?.parsed_problem || {};
    const tests = solution?.generated_tests || [];
    const isFailed = solution?.status === 'failed';
    const hasError = solution?.error_message;
    const isProcessing = solution?.status === 'pending' || solution?.status === 'processing';

    return (
        <AppLayout
            currentPath="/solve"
            badge="Codeforces"
            title={locale === 'ar' ? 'نتيجة التحليل والتوليد' : 'Analysis and generation result'}
            description={locale === 'ar'
                ? 'واجهة صريحة: التوليد موجود، الاختبارات التوضيحية موجودة، لكن الحكم النهائي ما يزال في وضع تجريبي.'
                : 'An honest surface: generation exists, illustrative tests exist, but final judging is still in stub mode.'}
            actions={(
                <Button asChild variant="soft" size="sm">
                    <Link href="/solve">{locale === 'ar' ? 'مسألة جديدة' : 'New problem'}</Link>
                </Button>
            )}
            contentClassName="px-6 py-6"
        >
            <div className="mx-auto max-w-5xl" dir={isRtl ? 'rtl' : 'ltr'}>
                {isProcessing && (
                    <div className="mb-6 rounded-[26px] border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-200">
                        <strong>جاري المعالجة في الخلفية…</strong> سيتم تحديث الصفحة تلقائياً عند الانتهاء.
                    </div>
                )}

                {isFailed && hasError && (
                    <div className="mb-6 rounded-[26px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                        <strong>فشل الحل:</strong> {solution.error_message}
                    </div>
                )}

                {(solution?.status === 'completed' || solution?.status === 'failed' || (isProcessing && solution?.problem_text)) && (
                    <div className="mb-6 flex flex-wrap gap-2 border-b border-[var(--app-border)] pb-4">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${activeTab === tab.id ? 'bg-cyan-400/12 text-cyan-200' : 'bg-slate-950/45 text-slate-300 hover:bg-white/6'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {activeTab === 'problem' && (
                    <section className="space-y-4">
                        <h2 className="text-slate-300 font-medium">المسألة (المُحلَّلة)</h2>
                        {parsed.title && (
                            <p className="font-medium text-cyan-200">{parsed.title}</p>
                        )}
                        {parsed.description && (
                            <div className="rounded-[26px] border border-[var(--app-border)] bg-slate-950/45 p-4">
                                <p className="text-slate-200 whitespace-pre-wrap">{parsed.description}</p>
                            </div>
                        )}
                        {parsed.input_format && (
                            <div>
                                <span className="text-slate-400 text-sm font-medium">صيغة الإدخال:</span>
                                <pre className="mt-1 rounded-[22px] border border-[var(--app-border)] bg-slate-950/55 p-3 text-sm text-slate-200 whitespace-pre-wrap font-mono">{parsed.input_format}</pre>
                            </div>
                        )}
                        {parsed.output_format && (
                            <div>
                                <span className="text-slate-400 text-sm font-medium">صيغة الإخراج:</span>
                                <pre className="mt-1 rounded-[22px] border border-[var(--app-border)] bg-slate-950/55 p-3 text-sm text-slate-200 whitespace-pre-wrap font-mono">{parsed.output_format}</pre>
                            </div>
                        )}
                        {parsed.constraints && (
                            <div>
                                <span className="text-slate-400 text-sm font-medium">القيود:</span>
                                <p className="mt-1 text-slate-200 text-sm whitespace-pre-wrap">{parsed.constraints}</p>
                            </div>
                        )}
                        {parsed.examples?.length > 0 && (
                            <div>
                                <span className="text-slate-400 text-sm font-medium">أمثلة:</span>
                                <ul className="mt-2 space-y-3">
                                    {parsed.examples.map((ex, i) => (
                                        <li key={i} className="rounded-[24px] border border-[var(--app-border)] bg-slate-950/45 p-3">
                                            <span className="text-slate-500 text-xs">Input:</span>
                                            <pre className="text-slate-200 text-sm whitespace-pre-wrap font-mono mt-0.5">{ex.input}</pre>
                                            <span className="text-slate-500 text-xs mt-2 block">Output:</span>
                                            <pre className="text-slate-200 text-sm whitespace-pre-wrap font-mono mt-0.5">{ex.output}</pre>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {!parsed.title && !parsed.description && (
                            <div className="rounded-[24px] border border-[var(--app-border)] bg-slate-950/45 p-4">
                                <p className="text-slate-400 text-sm">النص الأصلي للمسألة:</p>
                                <p className="text-slate-200 whitespace-pre-wrap mt-2">{solution?.problem_text}</p>
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'code' && (
                    <section>
                        <h2 className="text-slate-300 font-medium mb-2">كود الحل</h2>
                        {solution?.solution_language && <Badge variant="subtle" className="mb-2">{locale === 'ar' ? 'اللغة:' : 'Language:'} {solution.solution_language === 'cpp' ? 'C++' : 'Python'}</Badge>}
                        <pre className="overflow-x-auto rounded-[28px] border border-[var(--app-border)] bg-slate-950/70 p-4 text-sm"><code className="font-mono whitespace-pre text-cyan-100">{solution?.solution_code || '—'}</code></pre>
                    </section>
                )}

                {activeTab === 'explanation' && (
                    <section>
                        <h2 className="text-slate-300 font-medium mb-2">الشرح</h2>
                        <div className="rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-5">
                            <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{solution?.explanation || '—'}</p>
                        </div>
                    </section>
                )}

                {activeTab === 'judge' && (
                    <section className="space-y-4">
                        <h2 className="text-slate-300 font-medium mb-2">نتائج الحكم (وضع تجريبي)</h2>
                        <p className="text-slate-500 text-sm mb-3">
                            لا يوجد تنفيذ كود في بيئة معزولة. يُسجَّل تقرير توضيحي فقط؛ راجع تبويب الاختبارات للمدخلات المتوقعة.
                        </p>
                        {solution?.run_results?.message && (
                            <div className="rounded-[24px] border border-[var(--app-border)] bg-slate-950/45 p-4 text-sm text-slate-200">
                                {solution.run_results.message}
                            </div>
                        )}
                        {solution?.run_results?.test_cases?.length > 0 && (
                            <ul className="space-y-2">
                                {solution.run_results.test_cases.map((c) => (
                                    <li key={c.index} className="rounded-[24px] border border-[var(--app-border)] bg-slate-950/45 p-3 text-sm">
                                        <span className="text-slate-400">اختبار #{c.index + 1}</span>
                                        <span className="block text-amber-300 mt-1">{c.verdict}</span>
                                        {c.note && <p className="text-slate-400 mt-1">{c.note}</p>}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {!solution?.run_results && !isProcessing && <p className="text-slate-500">لا توجد بيانات حكم بعد.</p>}
                    </section>
                )}

                {activeTab === 'tests' && (
                    <section>
                        <h2 className="text-slate-300 font-medium mb-2">الاختبارات المُولَّدة</h2>
                        <p className="text-slate-500 text-sm mb-3">التحقق التلقائي من المخرجات غير مفعّل (حكم تجريبي فقط). انسخ المدخلات والمخرجات المتوقعة وشغّلها محلياً.</p>
                        {tests.length === 0 ? (
                            <p className="text-slate-500">لا توجد اختبارات.</p>
                        ) : (
                            <div className="space-y-4">
                                {tests.map((t, i) => (
                                    <div key={i} className="rounded-[24px] border border-[var(--app-border)] bg-slate-950/45 p-4">
                                        <span className="text-slate-500 text-xs">اختبار #{i + 1}</span>
                                        <div className="mt-2">
                                            <span className="text-slate-400 text-xs">Input:</span>
                                            <pre className="mt-0.5 rounded-[18px] bg-slate-950/70 p-2 text-sm text-slate-200 whitespace-pre-wrap font-mono">{t.input}</pre>
                                        </div>
                                        <div className="mt-2">
                                            <span className="text-slate-400 text-xs">Expected output:</span>
                                            <pre className="mt-0.5 rounded-[18px] bg-slate-950/70 p-2 text-sm text-slate-200 whitespace-pre-wrap font-mono">{t.expected_output}</pre>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'algorithm' && (
                    <section>
                        <h2 className="text-slate-300 font-medium mb-2">الخوارزمية والتطويرات والفائدة</h2>
                        <div className="rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-5">
                            <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{solution?.algorithm_breakdown || '—'}</p>
                        </div>
                    </section>
                )}

                <div className="mt-8 border-t border-[var(--app-border)] pt-6">
                    <Button asChild variant="surface">
                        <Link href="/solve">{locale === 'ar' ? 'حل مسألة أخرى' : 'Solve another problem'}</Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
