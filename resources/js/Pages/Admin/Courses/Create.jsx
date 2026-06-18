import { useUiLocale } from '@/lib/ui-locale';
import AdminLayout from '../AdminLayout';
import CourseForm from './CourseForm';

const copy = {
    en: { title: 'Create path', submit: 'Create path' },
    ar: { title: 'إنشاء مسار', submit: 'إنشاء المسار' },
};

export default function AdminCoursesCreate() {
    const { locale } = useUiLocale();
    const t = copy[locale];

    return (
        <AdminLayout title={t.title}>
            <CourseForm submitLabel={t.submit} action="/admin/courses" />
        </AdminLayout>
    );
}
