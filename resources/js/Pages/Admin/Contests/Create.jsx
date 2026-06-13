import { usePage } from '@inertiajs/react';

import { useUiLocale } from '@/lib/ui-locale';
import AdminLayout from '../AdminLayout';
import ContestForm from './ContestForm';

const copy = {
    en: {
        title: 'Create contest',
        subtitle: 'Schedule a round and attach problems.',
        submit: 'Create contest',
    },
    ar: {
        title: 'إنشاء مسابقة',
        subtitle: 'جدول جولة وأرفق المسائل.',
        submit: 'إنشاء المسابقة',
    },
};

const emptyContest = {
    title: '',
    slug: '',
    description: '',
    starts_at: '',
    ends_at: '',
    is_public: true,
    problems: [],
};

export default function AdminContestsCreate() {
    const { locale } = useUiLocale();
    const t = copy[locale];
    const { availableProblems = [] } = usePage().props;

    return (
        <AdminLayout title={t.title} subtitle={t.subtitle}>
            <ContestForm initialData={emptyContest} availableProblems={availableProblems} submitLabel={t.submit} method="post" action="/admin/contests" />
        </AdminLayout>
    );
}
