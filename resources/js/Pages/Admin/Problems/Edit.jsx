import { usePage } from '@inertiajs/react';

import { useUiLocale } from '@/lib/ui-locale';
import AdminLayout from '../AdminLayout';
import ProblemForm from './ProblemForm';

const copy = {
    en: {
        title: 'Edit problem',
        submit: 'Save changes',
    },
    ar: {
        title: 'تعديل المسألة',
        submit: 'حفظ التعديلات',
    },
};

export default function AdminProblemsEdit() {
    const { locale } = useUiLocale();
    const t = copy[locale];
    const { problem } = usePage().props;

    return (
        <AdminLayout title={t.title} subtitle={problem.title}>
            <ProblemForm initialData={problem} submitLabel={t.submit} method="put" action={`/admin/problems/${problem.id}`} />
        </AdminLayout>
    );
}
