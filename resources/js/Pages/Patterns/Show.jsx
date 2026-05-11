import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';

function Section({ title, children }) {
    if (!children) return null;
    return (
        <section className="space-y-3 rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-5">
            <h2 className="text-lg font-semibold text-cyan-200">{title}</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--app-muted-strong)]">{children}</div>
        </section>
    );
}

export default function PatternsShow() {
    const { pattern = {}, related_patterns = [], representative_problems = [], meta = {} } = usePage().props;
    const [hintsOpen, setHintsOpen] = useState(false);
    const { locale, isRtl } = useUiLocale();

    const titleAr = pattern.title?.ar ?? '';
    const titleEn = pattern.title?.en ?? '';

    return (
        <AppLayout
            currentPath="/patterns"
            badge={locale === 'ar' ? 'تفاصيل الموضوع' : 'Topic detail'}
            title={titleAr || titleEn}
            description={pattern.summary?.ar || pattern.summary?.en || (locale === 'ar' ? 'عرض منظّم لإشارات النمط، الحالات المناسبة، والمشكلات التمثيلية.' : 'A structured view of pattern signals, correct use cases, and representative problems.')}
            actions={(
                <>
                    <Button asChild variant="soft" size="sm">
                        <Link href="/assistant">{locale === 'ar' ? 'اسأل المساعد عن هذا الموضوع' : 'Ask the assistant about this topic'}</Link>
                    </Button>
                    <Button asChild variant="surface" size="sm">
                        <Link href="/patterns">{locale === 'ar' ? 'كل الموضوعات' : 'All topics'}</Link>
                    </Button>
                </>
            )}
            contentClassName="px-6 py-6"
        >
            <Head>
                <title>{meta.title}</title>
                <meta name="description" content={meta.description} />
                {meta.canonical && <link rel="canonical" href={meta.canonical} />}
            </Head>
            <div className="mx-auto max-w-5xl space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="rounded-[30px] border border-[var(--app-border)] bg-slate-950/45 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            {titleAr && titleEn && <p className="mt-1 text-sm text-slate-400" dir="ltr">
                        {titleEn}
                    </p>}
                            <p className="mt-3 text-sm leading-7 text-[var(--app-muted)]">{pattern.summary?.ar || pattern.summary?.en}</p>
                        </div>
                        <Badge variant="subtle">{pattern.pattern_id}</Badge>
                    </div>
                </div>

                <Section title={locale === 'ar' ? 'نبذة' : 'Summary'}>{pattern.summary?.ar || pattern.summary?.en}</Section>
                <Section title={locale === 'ar' ? 'متى تُستخدم' : 'When to use it'}>{pattern.when_to_use?.ar || pattern.when_to_use?.en}</Section>
                <Section title={locale === 'ar' ? 'متى لا تُستخدم / مضادات النمط' : 'When not to use it'}>{pattern.when_not_to_use?.ar || pattern.when_not_to_use?.en}</Section>
                <Section title={locale === 'ar' ? 'إشارات شائعة في نص المسألة' : 'Common statement signals'}>{pattern.statement_signals?.ar || pattern.statement_signals?.en}</Section>

                {pattern.related_techniques?.length > 0 && (
                    <section className="space-y-3 rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-5">
                        <h2 className="text-lg font-semibold text-cyan-200">{locale === 'ar' ? 'تقنيات ذات صلة' : 'Related techniques'}</h2>
                        <ul className="list-inside list-disc space-y-1 text-sm text-[var(--app-muted-strong)]">
                            {pattern.related_techniques.map((t) => (
                                <li key={t}>{t}</li>
                            ))}
                        </ul>
                    </section>
                )}

                {related_patterns.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold text-cyan-200">{locale === 'ar' ? 'أنماط ذات صلة' : 'Related topics'}</h2>
                        <ul className="grid gap-2 sm:grid-cols-2">
                            {related_patterns.map((rp) => (
                                <li key={rp.pattern_id}>
                                    <Link
                                        href={rp.href}
                                        className="block rounded-[24px] border border-[var(--app-border)] bg-slate-950/45 p-4 text-sm transition hover:border-[var(--app-border-strong)]"
                                    >
                                        <span className="text-cyan-200">{rp.title?.ar || rp.title?.en}</span>
                                        <span className="mt-1 block text-xs text-slate-500">{rp.pattern_id}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {representative_problems.length > 0 && (
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-cyan-200">{locale === 'ar' ? 'مسائل تمثيلية' : 'Representative problems'}</h2>
                        <div className="grid gap-3">
                            {representative_problems.map((p) => (
                                <div key={p.problem_id} className="group rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-5 transition-colors hover:border-[var(--app-border-strong)]">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            {p.href ? (
                                                <Link href={p.href} className="flex items-center gap-1 font-medium text-cyan-200 hover:underline">
                                                    {p.title_ar || p.title_en || p.slug}
                                                    <span className="text-xs font-normal text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">↗</span>
                                                </Link>
                                            ) : (
                                                <span className="font-medium text-slate-200">{p.title_ar || p.title_en || p.slug}</span>
                                            )}
                                            {!p.href && (
                                                <Badge variant="warning">{locale === 'ar' ? 'غير متوفرة حالياً' : 'Unavailable for now'}</Badge>
                                            )}
                                        </div>
                                        <div className="rounded border border-[var(--app-border)] bg-slate-950/70 px-2 py-1 font-mono text-[10px] text-slate-500" dir="ltr">
                                            {p.content_path.split('/').pop()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {pattern.benchmark_key && (
                    <section className="flex items-center gap-3 rounded-[24px] border border-[var(--app-border)] bg-slate-950/45 p-4 text-sm text-slate-400">
                        <span className="text-slate-500">{locale === 'ar' ? 'مفتاح المقارنة:' : 'Benchmark key:'}</span>
                        <code className="rounded bg-slate-950/70 px-2 py-0.5 font-mono text-xs text-cyan-200">{pattern.benchmark_key}</code>
                        <button
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(pattern.benchmark_key);
                            }}
                            className="text-[10px] text-slate-500 transition-colors hover:text-cyan-200"
                            title={locale === 'ar' ? 'نسخ' : 'Copy'}
                        >
                            {locale === 'ar' ? 'نسخ' : 'Copy'}
                        </button>
                    </section>
                )}

                {pattern.ollama_matching && (
                    <section className="overflow-hidden rounded-[28px] border border-[var(--app-border)] bg-slate-950/45">
                        <button
                            type="button"
                            onClick={() => setHintsOpen(!hintsOpen)}
                            className="w-full px-4 py-3 text-right text-sm text-slate-300 hover:bg-white/4"
                        >
                            {locale === 'ar' ? 'تلميحات مطابقة Ollama' : 'Ollama matching hints'} {hintsOpen ? '▼' : '◀'}
                        </button>
                        {hintsOpen && (
                            <div className="space-y-2 border-t border-[var(--app-border)] px-4 py-3 text-sm text-slate-400">
                                {pattern.ollama_matching.keywords?.length > 0 && (
                                    <p>
                                        <span className="text-slate-500">{locale === 'ar' ? 'كلمات:' : 'Keywords:'} </span>
                                        {pattern.ollama_matching.keywords.join(', ')}
                                    </p>
                                )}
                                {pattern.ollama_matching.negative_keywords?.length > 0 && (
                                    <p>
                                        <span className="text-slate-500">{locale === 'ar' ? 'سلبية:' : 'Negative:'} </span>
                                        {pattern.ollama_matching.negative_keywords.join(', ')}
                                    </p>
                                )}
                                {(pattern.ollama_matching.notes?.ar || pattern.ollama_matching.notes?.en) && (
                                    <p className="whitespace-pre-wrap">{pattern.ollama_matching.notes?.ar || pattern.ollama_matching.notes?.en}</p>
                                )}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
