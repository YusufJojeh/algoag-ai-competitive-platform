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
        title: 'Topic management',
        subtitle: (count) => `${count} topics in the problem taxonomy.`,
        newTopic: 'New topic',
        empty: 'No topics found.',
        name: 'Name',
        slug: 'Slug',
        problems: 'Problems',
        actions: 'Actions',
        edit: 'Edit',
        delete: 'Delete',
        confirmDelete: 'Delete this topic?',
    },
    ar: {
        title: 'إدارة الموضوعات',
        subtitle: (count) => `${count} موضوع في تصنيف المسائل.`,
        newTopic: 'موضوع جديد',
        empty: 'لا توجد موضوعات.',
        name: 'الاسم',
        slug: 'المعرف',
        problems: 'المسائل',
        actions: 'الإجراءات',
        edit: 'تعديل',
        delete: 'حذف',
        confirmDelete: 'هل تريد حذف هذا الموضوع؟',
    },
};

export default function AdminTopicsIndex() {
    const { locale } = useUiLocale();
    const t = copy[locale];
    const { topics = {}, flash } = usePage().props;
    const rows = topics.data ?? [];
    const count = topics.total ?? rows.length;

    return (
        <AdminLayout
            title={t.title}
            subtitle={t.subtitle(count)}
            actions={(
                <Button asChild>
                    <Link href="/admin/topics/create">
                        <Plus data-icon="inline-start" />
                        {t.newTopic}
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
                    <Table className="min-w-[680px]">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>{t.name}</TableHead>
                                <TableHead>{t.slug}</TableHead>
                                <TableHead>{t.problems}</TableHead>
                                <TableHead className="text-end">{t.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((topic) => (
                                <TopicRow key={topic.id} topic={topic} t={t} />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </AdminLayout>
    );
}

function TopicRow({ topic, t }) {
    const deleteForm = useForm({});

    return (
        <TableRow>
            <TableCell className="font-medium">{topic.name}</TableCell>
            <TableCell className="font-mono text-xs text-[var(--app-muted)]">{topic.slug}</TableCell>
            <TableCell>{topic.problems_count ?? 0}</TableCell>
            <TableCell>
                <div className="flex justify-end gap-2">
                    <Button asChild variant="surface" size="sm">
                        <Link href={`/admin/topics/${topic.id}/edit`}>{t.edit}</Link>
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={deleteForm.processing}
                        onClick={() => {
                            if (confirm(t.confirmDelete)) {
                                deleteForm.delete(`/admin/topics/${topic.id}`);
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
