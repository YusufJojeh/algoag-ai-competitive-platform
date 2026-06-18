import { useEffect } from 'react';
import { useForm, Link, usePage } from '@inertiajs/react';

import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';

function statusLabel(status, locale) {
    const labels = {
        completed: { ar: 'مكتمل', en: 'Completed' },
        failed: { ar: 'فشل', en: 'Failed' },
        pending: { ar: 'قيد الانتظار', en: 'Pending' },
        processing: { ar: 'قيد المعالجة', en: 'Processing' },
    };

    return labels[status]?.[locale] ?? status;
}

export default function CodeforcesSolve() {
    const { ollamaAvailable, recentSolutions = [], flash } = usePage().props;
    const { locale, isRtl } = useUiLocale();
    const { data, setData, post, processing, errors } = useForm({
        problem: '',
        language: 'python',
        response_language: locale,
    });

    useEffect(() => {
        setData('response_language', locale);
    }, [locale]);

    const ar = locale === 'ar';

    return (
        <AppLayout
            currentPath="/solve"
            badge="Codeforces"
            title={ar ? 'تحليل المسألة وحلها من النص الملصق' : 'Analyze and solve a pasted problem statement'}
            description={ar
                ? 'الصق نص المسألة كاملا، ثم تابع التحليل وتوليد الحل والاختبارات بوضوح.'
                : 'Paste the full statement, then track parsing, solution generation, and illustrative tests clearly.'}
            actions={(
                <Button asChild variant="soft" size="sm">
                    <Link href="/assistant">{ar ? 'انتقل إلى المساعد' : 'Go to assistant'}</Link>
                </Button>
            )}
            contentClassName="px-6 py-6"
        >
            <div className="mx-auto max-w-5xl space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
                {flash?.message && (
                    <div className="rounded-[22px] border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">
                        {flash.message}
                    </div>
                )}

                {!ollamaAvailable && (
                    <div className="rounded-[26px] border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                        <strong>{ar ? 'مزود الذكاء الاصطناعي غير متصل.' : 'AI provider is not connected.'}</strong>{' '}
                        {ar ? 'أضف' : 'Add'} <code className="rounded bg-slate-800 px-1">OPENAI_API_KEY</code>{' '}
                        {ar ? 'لتفعيل OpenAI، أو شغل' : 'to enable OpenAI, or run'} <code className="rounded bg-slate-800 px-1">ollama serve</code>
                    </div>
                )}

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        post('/solve', { preserveScroll: true });
                    }}
                    className="space-y-4 rounded-[30px] border border-[var(--app-border)] bg-slate-950/45 p-6"
                >
                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-300">{ar ? 'نص المسألة كاملا' : 'Full problem statement'}</span>
                        <textarea
                            value={data.problem}
                            onChange={(e) => setData('problem', e.target.value)}
                            placeholder={ar ? 'الصق هنا نص المسألة كاملا: العنوان، الوصف، الإدخال، الإخراج، القيود، والأمثلة...' : 'Paste the full statement here: title, description, input/output, constraints, and examples...'}
                            rows={14}
                            className="w-full rounded-[24px] border border-[var(--app-border)] bg-slate-950/70 px-4 py-3 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-[var(--app-border-strong)]"
                        />
                    </label>

                    <div className="flex flex-wrap items-center gap-4">
                        <input type="hidden" name="response_language" value={locale} />
                        <label className="flex items-center gap-2 text-slate-300 text-sm">
                            <span>{ar ? 'لغة الحل:' : 'Solution language:'}</span>
                            <select
                                value={data.language}
                                onChange={(e) => setData('language', e.target.value)}
                                className="rounded-2xl border border-[var(--app-border)] bg-slate-950/55 px-3 py-2 text-slate-100 outline-none focus:border-[var(--app-border-strong)]"
                            >
                                <option value="python">Python</option>
                                <option value="cpp">C++</option>
                            </select>
                        </label>
                    </div>

                    {errors.problem && <p className="text-red-400 text-sm">{errors.problem}</p>}
                    {errors.ollama && <p className="text-red-400 text-sm">{errors.ollama}</p>}
                    {errors.queue && <p className="text-red-400 text-sm">{errors.queue}</p>}

                    <Button type="submit" variant="lavender" disabled={processing || !data.problem.trim() || !ollamaAvailable}>
                        {processing
                            ? (ar ? 'جاري حل المسألة... قد يستغرق ذلك دقائق' : 'Solving the problem... this can take minutes')
                            : (ar ? 'حل المسألة' : 'Solve the problem')}
                    </Button>
                </form>

                {recentSolutions?.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold text-cyan-200">{ar ? 'آخر الحلول' : 'Recent solutions'}</h2>
                        <ul className="space-y-2">
                            {recentSolutions.map((s) => (
                                <li key={s.id}>
                                    <Link
                                        href={`/solve/result/${s.id}`}
                                        className="block rounded-[26px] border border-[var(--app-border)] bg-slate-950/45 p-4 text-sm text-slate-200 transition hover:border-[var(--app-border-strong)]"
                                    >
                                        <span className="text-slate-400 text-xs">{s.created_at}</span>
                                        {s.problem_title && (
                                            <p className="mt-1 font-medium text-cyan-100">{s.problem_title}</p>
                                        )}
                                        <p className="mt-1">{s.problem_preview}</p>
                                        <span className={`inline-block mt-3 rounded-full px-3 py-1 text-xs ${s.status === 'completed' ? 'bg-emerald-500/15 text-emerald-200' : s.status === 'failed' ? 'bg-red-500/15 text-red-200' : 'bg-white/8 text-slate-300'}`}>
                                            {statusLabel(s.status, locale)}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
