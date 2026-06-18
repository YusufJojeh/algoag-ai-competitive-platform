import { Link, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useUiLocale } from '@/lib/ui-locale';

const copy = {
    en: {
        name: 'Name',
        slug: 'Slug',
        slugPlaceholder: 'two-pointers',
        cancel: 'Cancel',
    },
    ar: {
        name: 'الاسم',
        slug: 'المعرّف',
        slugPlaceholder: 'two-pointers',
        cancel: 'إلغاء',
    },
};

export default function TopicForm({ initialData = {}, submitLabel, method = 'post', action }) {
    const { locale } = useUiLocale();
    const t = copy[locale];
    const { data, setData, post, put, processing, errors } = useForm({
        name: initialData.name ?? '',
        slug: initialData.slug ?? '',
    });

    const submit = (event) => {
        event.preventDefault();
        method === 'put' ? put(action) : post(action);
    };

    return (
        <form onSubmit={submit} className="flex max-w-2xl flex-col gap-5">
            <Field label={t.name} error={errors.name} htmlFor="topic-name">
                <Input id="topic-name" value={data.name} onChange={(event) => setData('name', event.target.value)} />
            </Field>

            <Field label={t.slug} error={errors.slug} htmlFor="topic-slug">
                <Input
                    id="topic-slug"
                    className="font-mono"
                    dir="ltr"
                    value={data.slug}
                    placeholder={t.slugPlaceholder}
                    onChange={(event) => setData('slug', event.target.value)}
                />
            </Field>

            <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={processing}>{submitLabel}</Button>
                <Button asChild variant="surface">
                    <Link href="/admin/topics">{t.cancel}</Link>
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
