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
        slugPlaceholder: 'dynamic-programming-track',
        lessons: 'Lessons',
        lessonsHint: 'Add the lessons students will see inside this path.',
        addLesson: 'Add lesson',
        noLessons: 'No lessons yet.',
        lessonTitle: 'Lesson title',
        lessonDescription: 'Lesson description',
        content: 'Content',
        videoUrl: 'Video URL',
        position: 'Position',
        published: 'Published',
        remove: 'Delete',
        cancel: 'Cancel',
    },
    ar: {
        title: 'العنوان',
        slug: 'المعرّف',
        description: 'الوصف',
        slugPlaceholder: 'dynamic-programming-track',
        lessons: 'الدروس',
        lessonsHint: 'أضف الدروس التي ستظهر للطلاب داخل هذا المسار.',
        addLesson: 'إضافة درس',
        noLessons: 'لا توجد دروس بعد.',
        lessonTitle: 'عنوان الدرس',
        lessonDescription: 'وصف الدرس',
        content: 'المحتوى',
        videoUrl: 'رابط الفيديو',
        position: 'الترتيب',
        published: 'منشور',
        remove: 'حذف',
        cancel: 'إلغاء',
    },
};

export default function CourseForm({ initialData = {}, submitLabel, method = 'post', action }) {
    const { locale } = useUiLocale();
    const t = copy[locale];
    const { data, setData, post, put, processing, errors } = useForm({
        title: initialData.title ?? '',
        slug: initialData.slug ?? '',
        description: initialData.description ?? '',
        lessons: initialData.lessons ?? [],
    });

    const submit = (event) => {
        event.preventDefault();
        method === 'put' ? put(action) : post(action);
    };

    const addLesson = () => {
        setData('lessons', [
            ...data.lessons,
            {
                title: '',
                description: '',
                content: '',
                video_url: '',
                position: data.lessons.length,
                is_published: true,
            },
        ]);
    };

    const updateLesson = (index, key, value) => {
        setData('lessons', data.lessons.map((lesson, i) => (i === index ? { ...lesson, [key]: value } : lesson)));
    };

    const removeLesson = (index) => {
        setData('lessons', data.lessons.filter((_, i) => i !== index));
    };

    return (
        <form onSubmit={submit} className="flex max-w-4xl flex-col gap-5">
            <Field label={t.title} error={errors.title} htmlFor="course-title">
                <Input id="course-title" value={data.title} onChange={(event) => setData('title', event.target.value)} />
            </Field>

            <Field label={t.slug} error={errors.slug} htmlFor="course-slug">
                <Input id="course-slug" className="font-mono" dir="ltr" value={data.slug} placeholder={t.slugPlaceholder} onChange={(event) => setData('slug', event.target.value)} />
            </Field>

            <Field label={t.description} error={errors.description} htmlFor="course-description">
                <Textarea id="course-description" value={data.description} onChange={(event) => setData('description', event.target.value)} />
            </Field>

            <section className="flex flex-col gap-3 rounded-2xl border border-[var(--app-border)] bg-slate-950/35 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <Label>{t.lessons}</Label>
                        <p className="mt-1 text-xs text-[var(--app-muted)]">{t.lessonsHint}</p>
                    </div>
                    <Button type="button" variant="surface" size="sm" onClick={addLesson}>{t.addLesson}</Button>
                </div>

                {data.lessons.length === 0 ? (
                    <p className="text-sm text-[var(--app-muted)]">{t.noLessons}</p>
                ) : (
                    data.lessons.map((lesson, index) => (
                        <div key={lesson.id ?? index} className="grid gap-3 rounded-2xl border border-[var(--app-border)] bg-slate-950/45 p-4">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium text-[var(--app-foreground)]">{t.lessons} {index + 1}</span>
                                <Button type="button" variant="danger" size="sm" onClick={() => removeLesson(index)}>{t.remove}</Button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
                                <Field label={t.lessonTitle} error={errors[`lessons.${index}.title`]} htmlFor={`lesson-title-${index}`}>
                                    <Input id={`lesson-title-${index}`} value={lesson.title} onChange={(event) => updateLesson(index, 'title', event.target.value)} />
                                </Field>
                                <Field label={t.position} error={errors[`lessons.${index}.position`]} htmlFor={`lesson-position-${index}`}>
                                    <Input id={`lesson-position-${index}`} type="number" min="0" value={lesson.position ?? index} onChange={(event) => updateLesson(index, 'position', Number(event.target.value))} />
                                </Field>
                            </div>
                            <Field label={t.lessonDescription} error={errors[`lessons.${index}.description`]} htmlFor={`lesson-description-${index}`}>
                                <Textarea id={`lesson-description-${index}`} value={lesson.description ?? ''} onChange={(event) => updateLesson(index, 'description', event.target.value)} />
                            </Field>
                            <Field label={t.content} error={errors[`lessons.${index}.content`]} htmlFor={`lesson-content-${index}`}>
                                <Textarea id={`lesson-content-${index}`} className="min-h-[140px]" value={lesson.content ?? lesson.body ?? ''} onChange={(event) => updateLesson(index, 'content', event.target.value)} />
                            </Field>
                            <Field label={t.videoUrl} error={errors[`lessons.${index}.video_url`]} htmlFor={`lesson-video-${index}`}>
                                <Input id={`lesson-video-${index}`} dir="ltr" value={lesson.video_url ?? ''} onChange={(event) => updateLesson(index, 'video_url', event.target.value)} />
                            </Field>
                            <label className="flex items-center gap-2 text-sm text-[var(--app-foreground)]">
                                <input type="checkbox" checked={Boolean(lesson.is_published ?? true)} onChange={(event) => updateLesson(index, 'is_published', event.target.checked)} />
                                {t.published}
                            </label>
                        </div>
                    ))
                )}
            </section>

            <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={processing}>{submitLabel}</Button>
                <Button asChild variant="surface">
                    <Link href="/admin/courses">{t.cancel}</Link>
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
