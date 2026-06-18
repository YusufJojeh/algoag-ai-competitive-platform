import { usePage } from '@inertiajs/react';

import { useUiLocale } from '@/lib/ui-locale';
import AdminLayout from '../AdminLayout';
import CourseForm from './CourseForm';

const copy = {
    en: { title: 'Edit path', submit: 'Save changes' },
    ar: { title: 'تعديل المسار', submit: 'حفظ التعديلات' },
};

export default function AdminCoursesEdit() {
    const { locale } = useUiLocale();
    const t = copy[locale];
    const { course } = usePage().props;

    return (
        <AdminLayout title={t.title} subtitle={course.title}>
            <CourseForm initialData={course} submitLabel={t.submit} method="put" action={`/admin/courses/${course.id}`} />
        </AdminLayout>
    );
}
