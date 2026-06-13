import { useUiLocale } from '@/lib/ui-locale';
import AdminLayout from '../AdminLayout';
import ProblemForm from './ProblemForm';

const copy = {
    en: {
        title: 'Create problem',
        subtitle: 'Add a database-backed problem for students and submissions.',
        submit: 'Create problem',
    },
    ar: {
        title: 'إنشاء مسألة',
        subtitle: 'أضف مسألة محفوظة في قاعدة البيانات للطلاب والتسليمات.',
        submit: 'إنشاء المسألة',
    },
};

const emptyProblem = {
    title: '',
    slug: '',
    statement: '',
    difficulty: 'easy',
    time_limit_ms: 1000,
    memory_limit_mb: 256,
};

export default function AdminProblemsCreate() {
    const { locale } = useUiLocale();
    const t = copy[locale];

    return (
        <AdminLayout title={t.title} subtitle={t.subtitle}>
            <ProblemForm initialData={emptyProblem} submitLabel={t.submit} method="post" action="/admin/problems" />
        </AdminLayout>
    );
}
