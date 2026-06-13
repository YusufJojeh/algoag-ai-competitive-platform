import { Link, useForm } from '@inertiajs/react';

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
        description: 'Description',
        startsAt: 'Starts at',
        endsAt: 'Ends at',
        isPublic: 'Public',
        problems: 'Problems',
        problem: 'Problem',
        label: 'Label',
        addProblem: 'Add problem',
        remove: 'Remove',
        noProblems: 'No problems added.',
        cancel: 'Cancel',
        slugPlaceholder: 'beginners-round-1',
        pick: 'Select a problem',
    },
    ar: {
        title: 'العنوان',
        slug: 'المعرف',
        description: 'الوصف',
        startsAt: 'يبدأ في',
        endsAt: 'ينتهي في',
        isPublic: 'عامة',
        problems: 'المسائل',
        problem: 'المسألة',
        label: 'الرمز',
        addProblem: 'إضافة مسألة',
        remove: 'حذف',
        noProblems: 'لم تتم إضافة مسائل.',
        cancel: 'إلغاء',
        slugPlaceholder: 'beginners-round-1',
        pick: 'اختر مسألة',
    },
};

export default function ContestForm({ initialData, availableProblems = [], submitLabel, method, action }) {
    const { locale } = useUiLocale();
    const t = copy[locale];
    const { data, setData, post, put, processing, errors } = useForm({
        title: initialData.title ?? '',
        slug: initialData.slug ?? '',
        description: initialData.description ?? '',
        starts_at: initialData.starts_at ?? '',
        ends_at: initialData.ends_at ?? '',
        is_public: initialData.is_public ?? true,
        problems: initialData.problems ?? [],
    });

    const submit = (event) => {
        event.preventDefault();
        method === 'put' ? put(action) : post(action);
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

            <div className="grid gap-4 md:grid-cols-2">
                <Field label={t.startsAt} error={errors.starts_at} htmlFor="contest-starts">
                    <Input id="contest-starts" type="datetime-local" value={data.starts_at} onChange={(e) => setData('starts_at', e.target.value)} />
                </Field>
                <Field label={t.endsAt} error={errors.ends_at} htmlFor="contest-ends">
                    <Input id="contest-ends" type="datetime-local" value={data.ends_at} onChange={(e) => setData('ends_at', e.target.value)} />
                </Field>
            </div>

            <label className="flex items-center gap-2 text-sm text-[var(--app-foreground)]">
                <input type="checkbox" checked={Boolean(data.is_public)} onChange={(e) => setData('is_public', e.target.checked)} />
                {t.isPublic}
            </label>

            <section className="flex flex-col gap-3 rounded-2xl border border-[var(--app-border)] bg-slate-950/35 p-4">
                <div className="flex items-center justify-between gap-2">
                    <Label>{t.problems}</Label>
                    <Button type="button" variant="surface" size="sm" onClick={addProblem}>{t.addProblem}</Button>
                </div>

                {data.problems.length === 0 ? (
                    <p className="text-sm text-[var(--app-muted)]">{t.noProblems}</p>
                ) : (
                    data.problems.map((entry, index) => (
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
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label={t.label} error={errors[`problems.${index}.label`]} htmlFor={`contest-label-${index}`}>
                                <Input id={`contest-label-${index}`} className="w-24 font-mono" dir="ltr" value={entry.label} onChange={(e) => updateProblem(index, 'label', e.target.value)} />
                            </Field>
                            <Button type="button" variant="danger" size="sm" onClick={() => removeProblem(index)}>{t.remove}</Button>
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

function Field({ label, error, htmlFor, children }) {
    return (
        <div className={cn('flex flex-col gap-2', error && 'text-[var(--app-danger)]')}>
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {error ? <p className="text-xs leading-5 text-[var(--app-danger)]">{error}</p> : null}
        </div>
    );
}
