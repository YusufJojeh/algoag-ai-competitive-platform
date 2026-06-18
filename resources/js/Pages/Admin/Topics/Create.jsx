import { useUiLocale } from '@/lib/ui-locale';
import AdminLayout from '../AdminLayout';
import TopicForm from './TopicForm';

const copy = {
    en: { title: 'Create topic', submit: 'Create topic' },
    ar: { title: 'إنشاء موضوع', submit: 'إنشاء الموضوع' },
};

export default function AdminTopicsCreate() {
    const { locale } = useUiLocale();
    const t = copy[locale];

    return (
        <AdminLayout title={t.title}>
            <TopicForm submitLabel={t.submit} action="/admin/topics" />
        </AdminLayout>
    );
}
