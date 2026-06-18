import { Link, useForm } from '@inertiajs/react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useUiLocale } from '@/lib/ui-locale';

const copy = {
    en: {
        title: 'Title',
        slug: 'Slug',
        statement: 'Statement',
        tags: 'Tags',
        tagsHint: 'Select one or more admin topics connected to this problem.',
        noTags: 'No topics exist yet. Create topics first from Admin Topics.',
        difficulty: 'Difficulty',
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
        extreme: 'Extreme',
        timeLimit: 'Time limit (ms)',
        memoryLimit: 'Memory limit (MB)',
        cancel: 'Cancel',
        slugPlaceholder: 'two-sum-basic',
        testCases: 'Test cases',
        testCasesHint: 'Sample cases are shown to users; the rest stay hidden and are used only for judging.',
        input: 'Input',
        expectedOutput: 'Expected output',
        sample: 'Sample (public)',
        addCase: 'Add test case',
        removeCase: 'Remove',
        caseLabel: 'Case',
        noCases: 'No test cases yet.',
    },
    ar: {
        title: 'العنوان',
        slug: 'المعرّف',
        statement: 'نص المسألة',
        tags: 'الوسوم',
        tagsHint: 'اختر موضوعا واحدا أو أكثر من موضوعات الإدارة المرتبطة بهذه المسألة.',
        noTags: 'لا توجد موضوعات بعد. أنشئ الموضوعات أولا من إدارة الموضوعات.',
        difficulty: 'الصعوبة',
        easy: 'سهل',
        medium: 'متوسط',
        hard: 'صعب',
        extreme: 'شديد',
        timeLimit: 'حد الزمن (ms)',
        memoryLimit: 'حد الذاكرة (MB)',
        cancel: 'إلغاء',
        slugPlaceholder: 'two-sum-basic',
        testCases: 'حالات الاختبار',
        testCasesHint: 'الحالات النموذجية تظهر للمستخدمين؛ والباقي مخفي ويستخدم للحكم فقط.',
        input: 'المدخلات',
        expectedOutput: 'المخرجات المتوقعة',
        sample: 'نموذجية (عامة)',
        addCase: 'إضافة حالة اختبار',
        removeCase: 'حذف',
        caseLabel: 'حالة',
        noCases: 'لا توجد حالات اختبار بعد.',
    },
};

export default function ProblemForm({ initialData, availableTags = [], submitLabel, method, action }) {
    const { locale } = useUiLocale();
    const t = copy[locale];
    const { data, setData, post, put, processing, errors } = useForm({
        title: initialData.title ?? '',
        slug: initialData.slug ?? '',
        statement: initialData.statement ?? '',
        difficulty: initialData.difficulty ?? 'easy',
        time_limit_ms: initialData.time_limit_ms ?? 1000,
        memory_limit_mb: initialData.memory_limit_mb ?? 256,
        tag_ids: initialData.tag_ids ?? [],
        test_cases: initialData.test_cases ?? [],
    });

    const submit = (event) => {
        event.preventDefault();
        method === 'put' ? put(action) : post(action);
    };

    const toggleTag = (tagId) => {
        const id = Number(tagId);
        const selected = data.tag_ids.map(Number);
        setData('tag_ids', selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
    };

    const addCase = () => {
        setData('test_cases', [...data.test_cases, { input: '', expected_output: '', is_sample: false }]);
    };

    const updateCase = (index, key, value) => {
        setData('test_cases', data.test_cases.map((c, i) => (i === index ? { ...c, [key]: value } : c)));
    };

    const removeCase = (index) => {
        setData('test_cases', data.test_cases.filter((_, i) => i !== index));
    };

    return (
        <form onSubmit={submit} className="flex max-w-4xl flex-col gap-5">
            <Field label={t.title} error={errors.title} htmlFor="problem-title">
                <Input id="problem-title" value={data.title} aria-invalid={Boolean(errors.title)} onChange={(event) => setData('title', event.target.value)} />
            </Field>

            <Field label={t.slug} error={errors.slug} htmlFor="problem-slug">
                <Input id="problem-slug" className="font-mono" dir="ltr" value={data.slug} aria-invalid={Boolean(errors.slug)} onChange={(event) => setData('slug', event.target.value)} placeholder={t.slugPlaceholder} />
            </Field>

            <Field label={t.statement} error={errors.statement} htmlFor="problem-statement">
                <Textarea id="problem-statement" className="min-h-[240px]" value={data.statement} aria-invalid={Boolean(errors.statement)} onChange={(event) => setData('statement', event.target.value)} />
            </Field>

            <section className="flex flex-col gap-3 rounded-2xl border border-[var(--app-border)] bg-slate-950/35 p-4">
                <div>
                    <Label>{t.tags}</Label>
                    <p className="mt-1 text-xs text-[var(--app-muted)]">{t.tagsHint}</p>
                </div>
                {availableTags.length === 0 ? (
                    <p className="text-sm text-[var(--app-muted)]">{t.noTags}</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map((tag) => {
                            const checked = data.tag_ids.map(Number).includes(Number(tag.id));

                            return (
                                <label key={tag.id} className={cn('cursor-pointer rounded-full border px-3 py-2 text-sm transition', checked ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100' : 'border-[var(--app-border)] bg-slate-950/45 text-[var(--app-muted)] hover:text-[var(--app-foreground)]')}>
                                    <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleTag(tag.id)} />
                                    <span>{tag.name}</span>
                                </label>
                            );
                        })}
                    </div>
                )}
                {errors.tag_ids ? <p className="text-xs leading-5 text-[var(--app-danger)]">{errors.tag_ids}</p> : null}
                {data.tag_ids.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {availableTags.filter((tag) => data.tag_ids.map(Number).includes(Number(tag.id))).map((tag) => (
                            <Badge key={tag.id} variant="subtle">{tag.name}</Badge>
                        ))}
                    </div>
                ) : null}
            </section>

            <div className="grid gap-4 md:grid-cols-3">
                <Field label={t.difficulty} error={errors.difficulty} htmlFor="problem-difficulty">
                    <select id="problem-difficulty" className="flex h-11 w-full rounded-2xl border border-[var(--app-border)] bg-slate-950/55 px-4 py-2 text-sm text-[var(--app-foreground)] shadow-sm outline-none transition focus-visible:border-[var(--app-border-strong)] focus-visible:ring-4 focus-visible:ring-cyan-400/10" value={data.difficulty} aria-invalid={Boolean(errors.difficulty)} onChange={(event) => setData('difficulty', event.target.value)}>
                        <option value="easy">{t.easy}</option>
                        <option value="medium">{t.medium}</option>
                        <option value="hard">{t.hard}</option>
                        <option value="extreme">{t.extreme}</option>
                    </select>
                </Field>
                <Field label={t.timeLimit} error={errors.time_limit_ms} htmlFor="problem-time-limit">
                    <Input id="problem-time-limit" type="number" min="1" value={data.time_limit_ms} aria-invalid={Boolean(errors.time_limit_ms)} onChange={(event) => setData('time_limit_ms', Number(event.target.value))} />
                </Field>
                <Field label={t.memoryLimit} error={errors.memory_limit_mb} htmlFor="problem-memory-limit">
                    <Input id="problem-memory-limit" type="number" min="1" value={data.memory_limit_mb} aria-invalid={Boolean(errors.memory_limit_mb)} onChange={(event) => setData('memory_limit_mb', Number(event.target.value))} />
                </Field>
            </div>

            <section className="flex flex-col gap-3 rounded-2xl border border-[var(--app-border)] bg-slate-950/35 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>{t.testCases}</Label>
                    <Button type="button" variant="surface" size="sm" onClick={addCase}>{t.addCase}</Button>
                </div>
                <p className="text-xs text-[var(--app-muted)]">{t.testCasesHint}</p>

                {data.test_cases.length === 0 ? (
                    <p className="text-sm text-[var(--app-muted)]">{t.noCases}</p>
                ) : (
                    data.test_cases.map((testCase, index) => (
                        <div key={index} className="flex flex-col gap-3 rounded-2xl border border-[var(--app-border)] bg-slate-950/45 p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[var(--app-foreground)]">{t.caseLabel} {index + 1}</span>
                                <Button type="button" variant="danger" size="sm" onClick={() => removeCase(index)}>{t.removeCase}</Button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <Field label={t.input} error={errors[`test_cases.${index}.input`]} htmlFor={`case-input-${index}`}>
                                    <Textarea id={`case-input-${index}`} className="min-h-[96px] font-mono" dir="ltr" value={testCase.input} onChange={(event) => updateCase(index, 'input', event.target.value)} />
                                </Field>
                                <Field label={t.expectedOutput} error={errors[`test_cases.${index}.expected_output`]} htmlFor={`case-output-${index}`}>
                                    <Textarea id={`case-output-${index}`} className="min-h-[96px] font-mono" dir="ltr" value={testCase.expected_output} onChange={(event) => updateCase(index, 'expected_output', event.target.value)} />
                                </Field>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-[var(--app-foreground)]">
                                <input type="checkbox" checked={Boolean(testCase.is_sample)} onChange={(event) => updateCase(index, 'is_sample', event.target.checked)} />
                                {t.sample}
                            </label>
                        </div>
                    ))
                )}
            </section>

            <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={processing}>{submitLabel}</Button>
                <Button asChild variant="surface">
                    <Link href="/admin/problems">{t.cancel}</Link>
                </Button>
            </div>
        </form>
    );
}

function Field({ label, error, htmlFor, children }) {
    return (
        <div className={cn('flex flex-col gap-2', error && 'text-[var(--app-danger)]')}>
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {error ? <p className="text-xs leading-5 text-[var(--app-danger)]">{error}</p> : null}
        </div>
    );
}
