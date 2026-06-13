import { Link, usePage } from '@inertiajs/react';
import { BarChart3, CheckCircle2, FileText, History, TriangleAlert } from 'lucide-react';

import AppLayout from '@/components/layout/AppLayout';
import EmptyState from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';

export default function Results() {
    const { problem = '', suggestions = [], benchmarkResults, recommendation = '', sessionId = null } = usePage().props;
    const { locale, isRtl } = useUiLocale();
    const resultsList = benchmarkResults ? Object.entries(benchmarkResults) : [];
    const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];

    return (
        <AppLayout
            currentPath="/assistant"
            badge={locale === 'ar' ? 'نتيجة المقارنة' : 'Benchmark result'}
            title={locale === 'ar' ? 'نتائج المحاكاة والتوصية' : 'Simulation results and recommendation'}
            description={locale === 'ar'
                ? 'قارن وقت وذاكرة المفاتيح المدعومة، ثم استخدم التوصية كخطوة تدريبية لا كحكم نهائي مطلق.'
                : 'Compare time and memory for supported keys, then treat the recommendation as coaching guidance rather than an absolute verdict.'}
            actions={(
                <>
                    <Button asChild variant="soft" size="sm">
                        <Link href="/assistant">{locale === 'ar' ? 'مسألة جديدة' : 'New prompt'}</Link>
                    </Button>
                    <Button asChild variant="surface" size="sm">
                        <Link href="/problems">{locale === 'ar' ? 'بنك المسائل' : 'Problem bank'}</Link>
                    </Button>
                </>
            )}
            contentClassName="px-6 py-6"
        >
            <div className="mx-auto max-w-5xl space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
                <section className="rounded-[30px] border border-[var(--app-border)] bg-slate-950/45 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
                        <FileText className="h-4 w-4" />
                        {locale === 'ar' ? 'المسألة' : 'Problem'}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--app-muted-strong)]">{problem}</p>
                </section>

                {safeSuggestions.length > 0 && (
                    <section className="rounded-[30px] border border-[var(--app-border)] bg-slate-950/45 p-5">
                        <h2 className="text-sm font-semibold text-[var(--app-foreground)]">
                            {locale === 'ar' ? 'المقاربات التي دخلت المقارنة' : 'Compared approaches'}
                        </h2>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {safeSuggestions.map((item, index) => (
                                <Badge key={`${item.name ?? 'approach'}-${index}`} variant="subtle" className="tracking-normal">
                                    {item.name ?? item.benchmark_key ?? 'Algorithm'}
                                </Badge>
                            ))}
                        </div>
                    </section>
                )}

                <section className="space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--app-foreground)]">
                            {locale === 'ar' ? 'مقارنة الأداء (محاكاة)' : 'Performance comparison (simulation)'}
                        </h2>
                        <p className="mt-1 text-sm text-[var(--app-muted)]">
                            {locale === 'ar'
                                ? 'المحاكاة تساعد على النقاش التعليمي حول التعقيد، وليست بديلاً عن الحكم الحقيقي على منصة المسابقة.'
                                : 'The simulation supports learning discussions about complexity; it is not a replacement for the contest judge.'}
                        </p>
                    </div>

                    {resultsList.length === 0 ? (
                        <EmptyState
                            icon={TriangleAlert}
                            title={locale === 'ar' ? 'لا توجد نتائج محاكاة' : 'No benchmark results'}
                            description={locale === 'ar'
                                ? 'لم تصل نتائج قابلة للعرض. ارجع إلى الاقتراحات أو جرّب وصف مسألة آخر.'
                                : 'No displayable results arrived. Go back to suggestions or try another problem description.'}
                        />
                    ) : (
                        <div className="overflow-x-auto rounded-[28px] border border-[var(--app-border)]">
                            <table className="w-full min-w-[720px] text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--app-border)] bg-slate-950/70 text-[var(--app-muted-strong)]">
                                        <th className="p-4 text-start">{locale === 'ar' ? 'الخوارزمية / المفتاح' : 'Algorithm / key'}</th>
                                        <th className="p-4 text-start">{locale === 'ar' ? 'الوقت (ms)' : 'Time (ms)'}</th>
                                        <th className="p-4 text-start">{locale === 'ar' ? 'الذاكرة (MB)' : 'Memory (MB)'}</th>
                                        <th className="p-4 text-start">{locale === 'ar' ? 'حجم n' : 'Input size n'}</th>
                                        <th className="p-4 text-start">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resultsList.map(([key, result]) => (
                                        <tr key={key} className="border-b border-[var(--app-border)] bg-slate-950/35 last:border-b-0">
                                            <td className="p-4 font-semibold text-cyan-200">{key}</td>
                                            <td className="p-4 text-[var(--app-muted-strong)]">{result.time_ms}</td>
                                            <td className="p-4 text-[var(--app-muted-strong)]">{result.memory_mb}</td>
                                            <td className="p-4 text-[var(--app-muted-strong)]">{result.n}</td>
                                            <td className="p-4">
                                                {result.error ? (
                                                    <span className="text-rose-300">{result.error}</span>
                                                ) : (
                                                    <Badge variant="success" className="tracking-normal">
                                                        {locale === 'ar' ? 'اكتملت' : 'Completed'}
                                                    </Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {recommendation && (
                    <section className="rounded-[30px] border border-emerald-400/25 bg-emerald-400/10 p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                            <CheckCircle2 className="h-4 w-4" />
                            {locale === 'ar' ? 'التوصية النهائية' : 'Final recommendation'}
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-emerald-50">{recommendation}</p>
                    </section>
                )}

                {sessionId && (
                    <div className="flex items-center gap-2 rounded-[24px] border border-[var(--app-border)] bg-slate-950/45 p-4 text-sm text-[var(--app-muted)]">
                        <History className="h-4 w-4 text-cyan-200" />
                        {locale === 'ar'
                            ? 'تم حفظ هذه الجلسة ويمكنك العودة إليها من سجل الجلسات.'
                            : 'This session was saved and can be revisited from your session history.'}
                    </div>
                )}

                <div className="flex flex-wrap gap-3 border-t border-[var(--app-border)] pt-6">
                    <Button asChild variant="lavender">
                        <Link href="/assistant">{locale === 'ar' ? 'مسألة جديدة' : 'New prompt'}</Link>
                    </Button>
                    <Button asChild variant="surface">
                        <Link href="/solve">{locale === 'ar' ? 'تحليل Codeforces' : 'Analyze Codeforces'}</Link>
                    </Button>
                    <Button asChild variant="surface">
                        <Link href="/patterns">{locale === 'ar' ? 'استكشف الموضوعات' : 'Explore topics'}</Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
