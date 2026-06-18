import { Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useUiLocale } from '@/lib/ui-locale';

const MIN_DURATION_MINUTES = 2;
const MAX_DURATION_MINUTES = 24 * 60;

const copy = {
    en: {
        title: 'Title',
        slug: 'Slug',
        description: 'Description',
        startsAt: 'Starts at',
        duration: 'Duration',
        durationHours: 'Duration hours',
        durationMinutes: 'Duration minutes',
        durationHint: 'Contest end time will be calculated automatically from the start time and duration.',
        durationTooShort: 'Contest duration must be at least two minutes.',
        durationTooLong: 'Contest duration may not exceed 24 hours.',
        calculatedEnd: 'Calculated end time',
        isPublic: 'Public',
        isPractice: 'Practice mode',
        problems: 'Problems',
        problem: 'Problem',
        label: 'Label',
        addProblem: 'Add problem',
        contestOnlyProblems: 'Contest-only problems',
        addContestOnlyProblem: 'Add contest-only problem',
        contestOnlyHint: 'These problems stay hidden from the public problem bank until the timed contest ends and the publisher runs.',
        statement: 'Statement',
        difficulty: 'Difficulty',
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
        extreme: 'Extreme',
        timeLimit: 'Time limit (ms)',
        memoryLimit: 'Memory limit (MB)',
        testCases: 'Test cases',
        addCase: 'Add test case',
        input: 'Input',
        expectedOutput: 'Expected output',
        sample: 'Sample (public)',
        publicProblem: 'Public',
        contestOnly: 'Contest-only',
        hiddenUntilEnd: 'Hidden until contest ends',
        published: 'Published',
        edit: 'Edit',
        remove: 'Remove',
        noProblems: 'No problems added.',
        cancel: 'Cancel',
        slugPlaceholder: 'beginners-round-1',
        pick: 'Select a problem',
        startAdjusted: 'Start time was adjusted to be at least two minutes from now.',
    },
    ar: {
        title: 'العنوان',
        slug: 'المعرّف',
        description: 'الوصف',
        startsAt: 'وقت البداية',
        duration: 'المدة',
        durationHours: 'عدد الساعات',
        durationMinutes: 'عدد الدقائق',
        durationHint: 'سيتم حساب وقت انتهاء الساحة تلقائيًا حسب وقت البداية والمدة.',
        durationTooShort: 'مدة المسابقة يجب أن تكون دقيقتين على الأقل.',
        durationTooLong: 'مدة المسابقة لا يمكن أن تتجاوز 24 ساعة.',
        calculatedEnd: 'وقت الانتهاء المتوقع',
        isPublic: 'عام',
        isPractice: 'وضع التدريب',
        problems: 'المسائل',
        problem: 'المسألة',
        label: 'الرمز',
        addProblem: 'إضافة مسألة',
        contestOnlyProblems: 'مسائل خاصة بالمسابقة',
        addContestOnlyProblem: 'إضافة مسألة خاصة',
        contestOnlyHint: 'تبقى هذه المسائل مخفية من بنك المسائل العام حتى تنتهي المسابقة المؤقتة ويعمل أمر النشر.',
        statement: 'نص المسألة',
        difficulty: 'الصعوبة',
        easy: 'سهل',
        medium: 'متوسط',
        hard: 'صعب',
        extreme: 'شديد',
        timeLimit: 'حد الوقت (ms)',
        memoryLimit: 'حد الذاكرة (MB)',
        testCases: 'حالات الاختبار',
        addCase: 'إضافة حالة اختبار',
        input: 'المدخلات',
        expectedOutput: 'المخرجات المتوقعة',
        sample: 'نموذجية (عامة)',
        publicProblem: 'عام',
        contestOnly: 'خاص بالمسابقة',
        hiddenUntilEnd: 'مخفي حتى نهاية المسابقة',
        published: 'منشور',
        edit: 'تعديل',
        remove: 'حذف',
        noProblems: 'لم تتم إضافة مسائل.',
        cancel: 'إلغاء',
        slugPlaceholder: 'beginners-round-1',
        pick: 'اختر مسألة',
        startAdjusted: 'تم ضبط وقت البداية ليكون بعد دقيقتين على الأقل.',
    },
};

export default function ContestForm({ initialData, availableProblems = [], scheduling = {}, submitLabel, method, action }) {
    const { locale } = useUiLocale();
    const t = copy[locale];
    const initialDuration = resolveInitialDuration(initialData);
    const [startAdjusted, setStartAdjusted] = useState(false);
    const [durationError, setDurationError] = useState('');
    const { data, setData, post, put, processing, errors } = useForm({
        title: initialData.title ?? '',
        slug: initialData.slug ?? '',
        description: initialData.description ?? '',
        starts_at: initialData.starts_at ?? '',
        duration_hours: initialDuration.hours,
        duration_minutes: initialDuration.minutes,
        is_public: initialData.is_public ?? true,
        is_practice: initialData.is_practice ?? false,
        problems: initialData.problems ?? [],
        contest_only_problems: initialData.contest_only_problems ?? [],
    });

    const totalDurationMinutes = (Number(data.duration_hours) || 0) * 60 + (Number(data.duration_minutes) || 0);
    const minimumStartAt = scheduling.minimum_starts_at || toDateTimeLocalValue(new Date(Date.now() + 2 * 60 * 1000));
    const calculatedEndTime = useMemo(() => {
        if (!data.starts_at || data.is_practice || totalDurationMinutes < MIN_DURATION_MINUTES) {
            return '';
        }

        const startsAt = new Date(data.starts_at);
        if (Number.isNaN(startsAt.getTime())) {
            return '';
        }

        return formatDateTimePreview(new Date(startsAt.getTime() + totalDurationMinutes * 60 * 1000));
    }, [data.starts_at, data.is_practice, totalDurationMinutes]);

    const submit = (event) => {
        event.preventDefault();

        if (!data.is_practice) {
            if (totalDurationMinutes < MIN_DURATION_MINUTES) {
                setDurationError(t.durationTooShort);
                return;
            }

            if (totalDurationMinutes > MAX_DURATION_MINUTES) {
                setDurationError(t.durationTooLong);
                return;
            }
        }

        setDurationError('');
        method === 'put' ? put(action) : post(action);
    };

    const adjustStartTime = (value) => {
        if (!value || data.is_practice) {
            setStartAdjusted(false);
            setData('starts_at', value);
            return;
        }

        if (!isBeforeDateTimeLocal(value, minimumStartAt)) {
            setStartAdjusted(false);
            setData('starts_at', value);
            return;
        }

        setStartAdjusted(true);
        setData('starts_at', minimumStartAt);
    };

    const updateDuration = (key, value) => {
        setDurationError('');
        setData(key, Math.max(0, Number(value) || 0));
    };

    const addProblem = () => {
        setData('problems', [...data.problems, { problem_id: availableProblems[0]?.id ?? '', label: '' }]);
    };

    const updateProblem = (index, key, value) => {
        setData('problems', data.problems.map((p, i) => (i === index ? { ...p, [key]: value } : p)));
    };

    const removeProblem = (index) => {
        setData('problems', data.problems.filter((_, i) => i !== index));
    };

    const addContestOnlyProblem = () => {
        setData('contest_only_problems', [
            ...data.contest_only_problems,
            {
                label: '',
                title: '',
                statement: '',
                difficulty: 'easy',
                time_limit_ms: 1000,
                memory_limit_mb: 256,
                test_cases: [],
            },
        ]);
    };

    const updateContestOnlyProblem = (index, key, value) => {
        setData('contest_only_problems', data.contest_only_problems.map((p, i) => (i === index ? { ...p, [key]: value } : p)));
    };

    const removeContestOnlyProblem = (index) => {
        setData('contest_only_problems', data.contest_only_problems.filter((_, i) => i !== index));
    };

    const addContestOnlyCase = (problemIndex) => {
        updateContestOnlyProblem(problemIndex, 'test_cases', [
            ...(data.contest_only_problems[problemIndex]?.test_cases ?? []),
            { input: '', expected_output: '', is_sample: false },
        ]);
    };

    const updateContestOnlyCase = (problemIndex, caseIndex, key, value) => {
        const problem = data.contest_only_problems[problemIndex];
        const testCases = (problem.test_cases ?? []).map((testCase, i) => (i === caseIndex ? { ...testCase, [key]: value } : testCase));
        updateContestOnlyProblem(problemIndex, 'test_cases', testCases);
    };

    const removeContestOnlyCase = (problemIndex, caseIndex) => {
        const problem = data.contest_only_problems[problemIndex];
        updateContestOnlyProblem(problemIndex, 'test_cases', (problem.test_cases ?? []).filter((_, i) => i !== caseIndex));
    };

    return (
        <form onSubmit={submit} className="flex max-w-4xl flex-col gap-5">
            <Field label={t.title} error={errors.title} htmlFor="contest-title">
                <Input id="contest-title" value={data.title} onChange={(e) => setData('title', e.target.value)} />
            </Field>

            <Field label={t.slug} error={errors.slug} htmlFor="contest-slug">
                <Input id="contest-slug" className="font-mono" dir="ltr" value={data.slug} placeholder={t.slugPlaceholder} onChange={(e) => setData('slug', e.target.value)} />
            </Field>

            <Field label={t.description} error={errors.description} htmlFor="contest-description">
                <Textarea id="contest-description" value={data.description} onChange={(e) => setData('description', e.target.value)} />
            </Field>

            <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-[var(--app-foreground)]">
                    <input type="checkbox" checked={Boolean(data.is_public)} onChange={(e) => setData('is_public', e.target.checked)} />
                    {t.isPublic}
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--app-foreground)]">
                    <input type="checkbox" checked={Boolean(data.is_practice)} onChange={(e) => setData('is_practice', e.target.checked)} />
                    {t.isPractice}
                </label>
            </div>

            <section className="grid gap-4 rounded-2xl border border-[var(--app-border)] bg-slate-950/35 p-4">
                <Field label={t.startsAt} error={errors.starts_at} htmlFor="contest-starts">
                    <Input
                        id="contest-starts"
                        type="datetime-local"
                        value={data.starts_at}
                        min={minimumStartAt}
                        onChange={(e) => adjustStartTime(e.target.value)}
                    />
                    {startAdjusted ? <p className="text-xs leading-5 text-amber-200">{t.startAdjusted}</p> : null}
                </Field>

                {!data.is_practice ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label={t.durationHours} error={errors.duration_hours} htmlFor="contest-duration-hours">
                            <Input id="contest-duration-hours" type="number" min="0" max="24" value={data.duration_hours} onChange={(e) => updateDuration('duration_hours', e.target.value)} />
                        </Field>
                        <Field label={t.durationMinutes} error={errors.duration_minutes || durationError} htmlFor="contest-duration-minutes">
                            <Input id="contest-duration-minutes" type="number" min="0" max="59" value={data.duration_minutes} onChange={(e) => updateDuration('duration_minutes', e.target.value)} />
                        </Field>
                    </div>
                ) : null}

                {!data.is_practice ? <p className="text-xs leading-5 text-[var(--app-muted)]">{t.durationHint}</p> : null}
                {calculatedEndTime ? (
                    <p className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                        {t.calculatedEnd}: <span dir="ltr">{calculatedEndTime}</span>
                    </p>
                ) : null}
            </section>

            <section className="flex flex-col gap-3 rounded-2xl border border-[var(--app-border)] bg-slate-950/35 p-4">
                <div className="flex items-center justify-between gap-2">
                    <Label>{t.problems}</Label>
                    <Button type="button" variant="surface" size="sm" onClick={addProblem}>{t.addProblem}</Button>
                </div>

                {data.problems.length === 0 ? (
                    <p className="text-sm text-[var(--app-muted)]">{t.noProblems}</p>
                ) : (
                    data.problems.map((entry, index) => {
                        const selectedProblem = availableProblems.find((problem) => Number(problem.id) === Number(entry.problem_id));

                        return (
                            <div key={index} className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--app-border)] bg-slate-950/45 p-3">
                                <Field label={t.problem} error={errors[`problems.${index}.problem_id`]} htmlFor={`contest-problem-${index}`}>
                                    <select
                                        id={`contest-problem-${index}`}
                                        className="flex h-11 w-full rounded-2xl border border-[var(--app-border)] bg-slate-950/55 px-4 py-2 text-sm text-[var(--app-foreground)] outline-none"
                                        value={entry.problem_id}
                                        onChange={(e) => updateProblem(index, 'problem_id', Number(e.target.value))}
                                    >
                                        <option value="">{t.pick}</option>
                                        {availableProblems.map((p) => (
                                            <option key={p.id} value={p.id}>{formatAvailableProblemOption(p, t)}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label={t.label} error={errors[`problems.${index}.label`]} htmlFor={`contest-label-${index}`}>
                                    <Input id={`contest-label-${index}`} className="w-24 font-mono" dir="ltr" value={entry.label} onChange={(e) => updateProblem(index, 'label', e.target.value)} />
                                </Field>
                                {selectedProblem?.published_from_contest_id ? (
                                    <Button asChild variant="surface" size="sm">
                                        <Link href={`/admin/problems/${selectedProblem.id}/edit`}>{t.edit}</Link>
                                    </Button>
                                ) : null}
                                <Button type="button" variant="danger" size="sm" onClick={() => removeProblem(index)}>{t.remove}</Button>
                            </div>
                        );
                    })
                )}
            </section>

            <section className="flex flex-col gap-3 rounded-2xl border border-[var(--app-border)] bg-slate-950/35 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <Label>{t.contestOnlyProblems}</Label>
                        <p className="mt-1 text-xs text-[var(--app-muted)]">{t.contestOnlyHint}</p>
                    </div>
                    <Button type="button" variant="surface" size="sm" onClick={addContestOnlyProblem}>
                        {t.addContestOnlyProblem}
                    </Button>
                </div>

                {data.contest_only_problems.length === 0 ? (
                    <p className="text-sm text-[var(--app-muted)]">{t.noProblems}</p>
                ) : (
                    data.contest_only_problems.map((entry, index) => (
                        <div key={index} className="flex flex-col gap-4 rounded-2xl border border-[var(--app-border)] bg-slate-950/45 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium text-[var(--app-foreground)]">{t.problem} {index + 1}</span>
                                    <Badge variant="warning">{t.hiddenUntilEnd}</Badge>
                                </div>
                                <Button type="button" variant="danger" size="sm" onClick={() => removeContestOnlyProblem(index)}>{t.remove}</Button>
                            </div>

                            <div className="grid gap-3 md:grid-cols-[120px_minmax(0,1fr)]">
                                <Field label={t.label} error={errors[`contest_only_problems.${index}.label`]} htmlFor={`contest-only-label-${index}`}>
                                    <Input id={`contest-only-label-${index}`} className="font-mono" dir="ltr" value={entry.label} onChange={(e) => updateContestOnlyProblem(index, 'label', e.target.value)} />
                                </Field>
                                <Field label={t.title} error={errors[`contest_only_problems.${index}.title`]} htmlFor={`contest-only-title-${index}`}>
                                    <Input id={`contest-only-title-${index}`} value={entry.title} onChange={(e) => updateContestOnlyProblem(index, 'title', e.target.value)} />
                                </Field>
                            </div>

                            <Field label={t.statement} error={errors[`contest_only_problems.${index}.statement`]} htmlFor={`contest-only-statement-${index}`}>
                                <Textarea id={`contest-only-statement-${index}`} className="min-h-[160px]" value={entry.statement} onChange={(e) => updateContestOnlyProblem(index, 'statement', e.target.value)} />
                            </Field>

                            <div className="grid gap-3 md:grid-cols-3">
                                <Field label={t.difficulty} error={errors[`contest_only_problems.${index}.difficulty`]} htmlFor={`contest-only-difficulty-${index}`}>
                                    <select
                                        id={`contest-only-difficulty-${index}`}
                                        className="flex h-11 w-full rounded-2xl border border-[var(--app-border)] bg-slate-950/55 px-4 py-2 text-sm text-[var(--app-foreground)] outline-none"
                                        value={entry.difficulty}
                                        onChange={(e) => updateContestOnlyProblem(index, 'difficulty', e.target.value)}
                                    >
                                        <option value="easy">{t.easy}</option>
                                        <option value="medium">{t.medium}</option>
                                        <option value="hard">{t.hard}</option>
                                        <option value="extreme">{t.extreme}</option>
                                    </select>
                                </Field>
                                <Field label={t.timeLimit} error={errors[`contest_only_problems.${index}.time_limit_ms`]} htmlFor={`contest-only-time-${index}`}>
                                    <Input id={`contest-only-time-${index}`} type="number" min="1" value={entry.time_limit_ms} onChange={(e) => updateContestOnlyProblem(index, 'time_limit_ms', Number(e.target.value))} />
                                </Field>
                                <Field label={t.memoryLimit} error={errors[`contest_only_problems.${index}.memory_limit_mb`]} htmlFor={`contest-only-memory-${index}`}>
                                    <Input id={`contest-only-memory-${index}`} type="number" min="1" value={entry.memory_limit_mb} onChange={(e) => updateContestOnlyProblem(index, 'memory_limit_mb', Number(e.target.value))} />
                                </Field>
                            </div>

                            <div className="flex flex-col gap-3 rounded-2xl border border-[var(--app-border)] bg-slate-950/35 p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <Label>{t.testCases}</Label>
                                    <Button type="button" variant="surface" size="sm" onClick={() => addContestOnlyCase(index)}>{t.addCase}</Button>
                                </div>
                                {(entry.test_cases ?? []).length === 0 ? (
                                    <p className="text-sm text-[var(--app-muted)]">{t.noProblems}</p>
                                ) : (
                                    entry.test_cases.map((testCase, caseIndex) => (
                                        <div key={caseIndex} className="grid gap-3 rounded-2xl border border-[var(--app-border)] bg-slate-950/45 p-3 md:grid-cols-2">
                                            <Field label={t.input} error={errors[`contest_only_problems.${index}.test_cases.${caseIndex}.input`]} htmlFor={`contest-only-input-${index}-${caseIndex}`}>
                                                <Textarea id={`contest-only-input-${index}-${caseIndex}`} className="min-h-[88px] font-mono" dir="ltr" value={testCase.input} onChange={(e) => updateContestOnlyCase(index, caseIndex, 'input', e.target.value)} />
                                            </Field>
                                            <Field label={t.expectedOutput} error={errors[`contest_only_problems.${index}.test_cases.${caseIndex}.expected_output`]} htmlFor={`contest-only-output-${index}-${caseIndex}`}>
                                                <Textarea id={`contest-only-output-${index}-${caseIndex}`} className="min-h-[88px] font-mono" dir="ltr" value={testCase.expected_output} onChange={(e) => updateContestOnlyCase(index, caseIndex, 'expected_output', e.target.value)} />
                                            </Field>
                                            <label className="flex items-center gap-2 text-sm text-[var(--app-foreground)]">
                                                <input type="checkbox" checked={Boolean(testCase.is_sample)} onChange={(e) => updateContestOnlyCase(index, caseIndex, 'is_sample', e.target.checked)} />
                                                {t.sample}
                                            </label>
                                            <Button type="button" variant="danger" size="sm" onClick={() => removeContestOnlyCase(index, caseIndex)}>{t.remove}</Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))
                )}
            </section>

            <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={processing}>{submitLabel}</Button>
                <Button asChild variant="surface">
                    <Link href="/admin/contests">{t.cancel}</Link>
                </Button>
            </div>
        </form>
    );
}

function resolveInitialDuration(initialData) {
    if (Number.isInteger(initialData.duration_hours) || Number.isInteger(initialData.duration_minutes)) {
        return {
            hours: initialData.duration_hours ?? 0,
            minutes: initialData.duration_minutes ?? 0,
        };
    }

    if (!initialData.starts_at || !initialData.ends_at) {
        return { hours: 0, minutes: 30 };
    }

    const startsAt = new Date(initialData.starts_at);
    const endsAt = new Date(initialData.ends_at);
    const totalMinutes = Math.max(0, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000));

    return {
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
    };
}

function problemVisibilityLabel(problem, t) {
    if (problem.is_public && problem.published_at) {
        return t.published;
    }

    if (problem.is_public) {
        return t.publicProblem;
    }

    if (problem.published_from_contest_id) {
        return t.contestOnly;
    }

    return t.hiddenUntilEnd;
}

function formatAvailableProblemOption(problem, t) {
    const hasVisibilityMeta = Object.prototype.hasOwnProperty.call(problem, 'is_public')
        || Object.prototype.hasOwnProperty.call(problem, 'published_at')
        || Object.prototype.hasOwnProperty.call(problem, 'published_from_contest_id');

    if (!hasVisibilityMeta) {
        return problem.title;
    }

    return `${problem.title} (${problemVisibilityLabel(problem, t)})`;
}

function toDateTimeLocalValue(date) {
    const pad = (value) => String(value).padStart(2, '0');

    return [
        date.getFullYear(),
        '-',
        pad(date.getMonth() + 1),
        '-',
        pad(date.getDate()),
        'T',
        pad(date.getHours()),
        ':',
        pad(date.getMinutes()),
    ].join('');
}

function isBeforeDateTimeLocal(value, minimum) {
    if (!value || !minimum) {
        return false;
    }

    return normalizeDateTimeLocal(value) < normalizeDateTimeLocal(minimum);
}

function normalizeDateTimeLocal(value) {
    return String(value).replace(' ', 'T').slice(0, 16);
}

function formatDateTimePreview(date) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
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
