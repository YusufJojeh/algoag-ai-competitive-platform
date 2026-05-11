import { Link, useForm, usePage } from '@inertiajs/react';

import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';

export default function ProblemsShow() {
    const { problem } = usePage().props;
    const { locale, isRtl } = useUiLocale();
    const { data, setData, post, processing, errors } = useForm({
        problem_id: problem?.id,
        language: 'cpp',
        code: '',
    });

    return (
        <AppLayout
            currentPath="/problems"
            badge={locale === 'ar' ? 'تفاصيل المسألة' : 'Problem detail'}
            title={problem?.title}
            description={locale === 'ar'
                ? 'راجع نص المسألة، ثم استخدم المساعد لتحديد الموضوع أو فحص فكرتك قبل طلب الحل الكامل.'
                : 'Review the statement, then use the assistant to identify the topic or validate your idea before requesting the full solution.'}
            actions={(
                <>
                    <Button asChild variant="soft" size="sm">
                        <Link href="/assistant">{locale === 'ar' ? 'اسأل المساعد عن هذه المسألة' : 'Ask the assistant about this problem'}</Link>
                    </Button>
                    <Button asChild variant="surface" size="sm">
                        <Link href="/problems">{locale === 'ar' ? 'كل المسائل' : 'All problems'}</Link>
                    </Button>
                </>
            )}
            contentClassName="px-6 py-6"
        >
            <div className="mx-auto max-w-5xl space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="subtle">{locale === 'ar' ? `الصعوبة: ${problem?.difficulty}` : `Difficulty: ${problem?.difficulty}`}</Badge>
                    <Badge variant="subtle">{locale === 'ar' ? `الوقت: ${problem?.time_limit_ms} ms` : `Time: ${problem?.time_limit_ms} ms`}</Badge>
                    <Badge variant="subtle">{locale === 'ar' ? `الذاكرة: ${problem?.memory_limit_mb} MB` : `Memory: ${problem?.memory_limit_mb} MB`}</Badge>
                </div>
                <div className="rounded-[30px] border border-[var(--app-border)] bg-slate-950/45 p-6 whitespace-pre-wrap text-sm leading-7 text-slate-200">
                    {problem?.statement}
                </div>

                <section className="rounded-[30px] border border-[var(--app-border)] bg-slate-950/45 p-6">
                    <h2 className="mb-3 text-lg font-semibold text-[var(--app-foreground)]">{locale === 'ar' ? 'إرسال حل' : 'Submit a solution'}</h2>
                    <p className="mb-4 text-sm text-[var(--app-muted)]">
                        {locale === 'ar'
                            ? 'الإرسال الحالي للتسجيل والمراجعة التجريبية فقط. لا يوجد تنفيذ معزول فعلي بعد.'
                            : 'Current submissions are stored for review and stub verification only. Real isolated execution is not wired yet.'}
                    </p>
                    <form
                        className="space-y-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            post('/submissions');
                        }}
                    >
                        <label className="block">
                            <span className="text-sm text-slate-400">{locale === 'ar' ? 'اللغة' : 'Language'}</span>
                            <select
                                value={data.language}
                                onChange={(e) => setData('language', e.target.value)}
                                className="mt-2 w-full rounded-[24px] border border-[var(--app-border)] bg-slate-950/55 px-4 py-3 text-sm text-[var(--app-foreground)] outline-none focus:border-[var(--app-border-strong)]"
                            >
                                <option value="cpp">C++</option>
                                <option value="python">Python</option>
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-sm text-slate-400">{locale === 'ar' ? 'الكود' : 'Code'}</span>
                            <textarea
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                rows={12}
                                className="mt-2 w-full rounded-[24px] border border-[var(--app-border)] bg-slate-950/70 px-4 py-3 font-mono text-sm text-[var(--app-foreground)] outline-none focus:border-[var(--app-border-strong)]"
                            />
                            {errors.code && <p className="text-red-400 text-sm">{errors.code}</p>}
                        </label>
                        <Button type="submit" variant="lavender" disabled={processing || !data.code.trim()}>
                            {locale === 'ar' ? 'إرسال الحل' : 'Submit solution'}
                        </Button>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
