import { Link, useForm, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUiLocale } from '@/lib/ui-locale';
import AdminLayout from '../AdminLayout';

const copy = {
    en: {
        title: 'Path management',
        subtitle: (count) => `${count} learning paths or courses.`,
        newCourse: 'New path',
        empty: 'No paths found.',
        name: 'Title',
        slug: 'Slug',
        lessons: 'Lessons',
        actions: 'Actions',
        edit: 'Edit',
        delete: 'Delete',
        confirmDelete: 'Delete this path?',
    },
    ar: {
        title: 'إدارة المسارات',
        subtitle: (count) => `${count} مسار تعليمي.`,
        newCourse: 'مسار جديد',
        empty: 'لا توجد مسارات.',
        name: 'العنوان',
        slug: 'المعرف',
        lessons: 'الدروس',
        actions: 'الإجراءات',
        edit: 'تعديل',
        delete: 'حذف',
        confirmDelete: 'هل تريد حذف هذا المسار؟',
    },
};

export default function AdminCoursesIndex() {
    const { locale } = useUiLocale();
    const t = copy[locale];
    const { courses = {}, flash } = usePage().props;
    const rows = courses.data ?? [];
    const count = courses.total ?? rows.length;

    return (
        <AdminLayout
            title={t.title}
            subtitle={t.subtitle(count)}
            actions={(
                <Button asChild>
                    <Link href="/admin/courses/create">
                        <Plus data-icon="inline-start" />
                        {t.newCourse}
                    </Link>
                </Button>
            )}
        >
            {flash?.message ? (
                <Alert className="mb-5 border-emerald-400/20 bg-emerald-400/10">
                    <AlertDescription>{flash.message}</AlertDescription>
                </Alert>
            ) : null}

            <Card className="overflow-hidden bg-slate-950/55">
                {rows.length === 0 ? (
                    <CardContent className="p-6">
                        <p className="text-sm text-[var(--app-muted)]">{t.empty}</p>
                    </CardContent>
                ) : (
                    <Table className="min-w-[760px]">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>{t.name}</TableHead>
                                <TableHead>{t.slug}</TableHead>
                                <TableHead>{t.lessons}</TableHead>
                                <TableHead className="text-end">{t.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((course) => (
                                <CourseRow key={course.id} course={course} t={t} />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </AdminLayout>
    );
}

function CourseRow({ course, t }) {
    const deleteForm = useForm({});

    return (
        <TableRow>
            <TableCell>
                <p className="font-medium">{course.title}</p>
                {course.description ? <p className="mt-1 line-clamp-2 text-xs text-[var(--app-muted)]">{course.description}</p> : null}
            </TableCell>
            <TableCell className="font-mono text-xs text-[var(--app-muted)]">{course.slug}</TableCell>
            <TableCell>{course.lessons_count ?? 0}</TableCell>
            <TableCell>
                <div className="flex justify-end gap-2">
                    <Button asChild variant="surface" size="sm">
                        <Link href={`/admin/courses/${course.id}/edit`}>{t.edit}</Link>
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={deleteForm.processing}
                        onClick={() => {
                            if (confirm(t.confirmDelete)) {
                                deleteForm.delete(`/admin/courses/${course.id}`);
                            }
                        }}
                    >
                        {t.delete}
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}
