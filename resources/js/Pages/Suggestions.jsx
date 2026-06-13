import { Link, useForm, usePage } from '@inertiajs/react';
import { Activity, AlertTriangle, Binary, Gauge } from 'lucide-react';

import AppLayout from '@/components/layout/AppLayout';
import EmptyState from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';

export default function Suggestions() {
    const { problem = '', suggestions = [], ollamaAvailable = true } = usePage().props;
    const { locale, isRtl } = useUiLocale();
    const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];
    const { post, processing } = useForm(
        { problem, suggestions: safeSuggestions },
        { preserveState: true }
    );

    return (
        <AppLayout
            currentPath="/assistant"
            badge={locale === 'ar' ? 'اقتراح خوارزميات' : 'Algorithm suggestions'}
            title={locale === 'ar' ? 'حوّل وصف المسألة إلى مقاربات قابلة للمقارنة' : 'Turn the problem description into comparable approaches'}
            description={locale === 'ar'
                ? 'هذه المرحلة تقترح أنماطاً وخوارزميات، ثم ترسلها إلى محاكاة أداء محلية قبل اختيار المسار الأنسب.'
                : 'This stage proposes patterns and algorithms, then sends them into a local benchmark simulation before choosing a direction.'}
            actions={(
                <>
                    <Button asChild variant="soft" size="sm">
                        <Link href="/assistant">{locale === 'ar' ? 'المساعد الصوتي والبصري' : 'Voice + vision assistant'}</Link>
                    </Button>
                    <Button asChild variant="surface" size="sm">
                        <Link href="/solve">Codeforces</Link>
                    </Button>
                </>
            )}
            contentClassName="px-6 py-6"
        >
            <div className="mx-auto max-w-5xl space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
                {!ollamaAvailable && (
                    <div className="rounded-[26px] border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-200">
                        <strong>{locale === 'ar' ? 'Ollama غير متصل حالياً.' : 'Ollama is currently unavailable.'}</strong>{' '}
                        {locale === 'ar'
                            ? 'يمكنك مراجعة الاقتراحات المعروضة، لكن تشغيل محاكاة جديدة قد يفشل حتى يعود المزود.'
                            : 'You can review the current suggestions, but running a fresh benchmark may fail until the provider is back.'}
                    </div>
                )}

                <section className="rounded-[30px] border border-[var(--app-border)] bg-slate-950/45 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
                        <Binary className="h-4 w-4" />
                        {locale === 'ar' ? 'وصف المسألة' : 'Problem description'}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--app-muted-strong)]">{problem}</p>
                </section>

                <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--app-foreground)]">
                                {locale === 'ar' ? 'خوارزميات مقترحة' : 'Suggested algorithms'}
                            </h2>
                            <p className="mt-1 text-sm text-[var(--app-muted)]">
                                {locale === 'ar'
                                    ? 'راجع التعقيد، متى تكون المقاربة مناسبة، ومفتاح المحاكاة قبل التشغيل.'
                                    : 'Review complexity, fit, and benchmark key before running the simulation.'}
                            </p>
                        </div>
                        <Badge variant="subtle">
                            {locale === 'ar' ? `${safeSuggestions.length} اقتراح` : `${safeSuggestions.length} suggestions`}
                        </Badge>
                    </div>

                    {safeSuggestions.length === 0 ? (
                        <EmptyState
                            icon={AlertTriangle}
                            title={locale === 'ar' ? 'لا توجد اقتراحات قابلة للعرض' : 'No suggestions to display'}
                            description={locale === 'ar'
                                ? 'حاول الرجوع إلى المساعد وإرسال وصف أوضح للمسألة مع القيود والأمثلة.'
                                : 'Go back to the assistant and send a clearer problem description with constraints and samples.'}
                            actionLabel={locale === 'ar' ? 'العودة إلى المساعد' : 'Back to assistant'}
                            onAction={() => { window.location.href = '/assistant'; }}
                        />
                    ) : (
                        <ul className="grid gap-4 lg:grid-cols-2">
                            {safeSuggestions.map((algo, index) => (
                                <li key={`${algo.name ?? 'algorithm'}-${index}`} className="rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-base font-semibold text-cyan-200">{algo.name}</p>
                                            <p className="mt-2 text-sm leading-6 text-[var(--app-muted-strong)]">{algo.description}</p>
                                        </div>
                                        <Badge variant="app">{algo.benchmark_key ?? 'sorting'}</Badge>
                                    </div>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        <Metric icon={Gauge} label={locale === 'ar' ? 'الوقت' : 'Time'} value={algo.complexity_time ?? 'Varies'} />
                                        <Metric icon={Activity} label={locale === 'ar' ? 'الذاكرة' : 'Memory'} value={algo.complexity_space ?? 'Varies'} />
                                    </div>
                                    <p className="mt-4 text-xs leading-6 text-[var(--app-muted)]">
                                        <span className="font-semibold text-[var(--app-muted-strong)]">{locale === 'ar' ? 'متى تكون الأنسب:' : 'Best when:'}</span>{' '}
                                        {algo.when_best ?? '-'}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        post('/benchmark', { preserveScroll: true });
                    }}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-5"
                >
                    <p className="max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
                        {locale === 'ar'
                            ? 'شغّل محاكاة الأداء على مفاتيح الخوارزميات المدعومة، ثم احصل على توصية نهائية محفوظة في سجل الجلسات.'
                            : 'Run the supported benchmark keys, then get a final recommendation saved to the session history.'}
                    </p>
                    <Button type="submit" variant="lavender" disabled={processing || safeSuggestions.length === 0}>
                        {processing
                            ? (locale === 'ar' ? 'جاري تشغيل المحاكاة...' : 'Running simulation...')
                            : (locale === 'ar' ? 'تشغيل محاكاة الأداء والمقارنة' : 'Run benchmark comparison')}
                    </Button>
                </form>
            </div>
        </AppLayout>
    );
}

function Metric({ icon: Icon, label, value }) {
    return (
        <div className="rounded-[22px] border border-[var(--app-border)] bg-slate-950/55 p-3">
            <div className="flex items-center gap-2 text-xs text-[var(--app-muted)]">
                <Icon className="h-3.5 w-3.5" />
                {label}
            </div>
            <p className="mt-2 text-sm font-semibold text-[var(--app-foreground)]">{value}</p>
        </div>
    );
}
