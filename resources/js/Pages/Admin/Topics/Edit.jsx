import { usePage } from '@inertiajs/react';

import { useUiLocale } from '@/lib/ui-locale';
import AdminLayout from '../AdminLayout';
import TopicForm from './TopicForm';

const copy = {
    en: { title: 'Edit topic', submit: 'Save changes' },
    ar: { title: 'تعديل الموضوع', submit: 'حفظ التعديلات' },
};

export default function AdminTopicsEdit() {
    const { locale } = useUiLocale();
    const t = copy[locale];
    const { topic } = usePage().props;

    return (
        <AdminLayout title={t.title} subtitle={topic.name}>
            <TopicForm initialData={topic} submitLabel={t.submit} method="put" action={`/admin/topics/${topic.id}`} />
        </AdminLayout>
    );
}
