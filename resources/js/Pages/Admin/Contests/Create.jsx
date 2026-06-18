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
    duration_hours: 0,
    duration_minutes: 30,
    is_public: true,
    is_practice: false,
    problems: [],
    contest_only_problems: [],
};

export default function AdminContestsCreate() {
    const { locale } = useUiLocale();
    const t = copy[locale];
    const { availableProblems = [], scheduling = {} } = usePage().props;

    return (
        <AdminLayout title={t.title} subtitle={t.subtitle}>
            <ContestForm initialData={emptyContest} availableProblems={availableProblems} scheduling={scheduling} submitLabel={t.submit} method="post" action="/admin/contests" />
        </AdminLayout>
    );
}
