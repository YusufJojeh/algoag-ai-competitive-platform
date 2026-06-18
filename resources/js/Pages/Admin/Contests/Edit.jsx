import { usePage } from '@inertiajs/react';

import { useUiLocale } from '@/lib/ui-locale';
import AdminLayout from '../AdminLayout';
import ContestForm from './ContestForm';

const copy = {
    en: {
        title: 'Edit contest',
        submit: 'Save changes',
    },
    ar: {
        title: 'تعديل المسابقة',
        submit: 'حفظ التعديلات',
    },
};

export default function AdminContestsEdit() {
    const { locale } = useUiLocale();
    const t = copy[locale];
    const { contest, availableProblems = [], scheduling = {} } = usePage().props;

    return (
        <AdminLayout title={t.title} subtitle={contest.title}>
            <ContestForm initialData={contest} availableProblems={availableProblems} scheduling={scheduling} submitLabel={t.submit} method="put" action={`/admin/contests/${contest.slug}`} />
        </AdminLayout>
    );
}
