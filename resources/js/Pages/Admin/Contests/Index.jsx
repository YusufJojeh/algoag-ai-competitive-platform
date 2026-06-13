import { Link, useForm, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';
import AdminLayout from '../AdminLayout';

const copy = {
    en: {
        title: 'Contest management',
        subtitle: (count) => `${count} contests.`,
        newContest: 'New contest',
        createContest: 'Create contest',
        empty: 'No contests yet. Create the first one.',
        tableTitle: 'Title',
        slug: 'Slug',
        visibility: 'Visibility',
        public: 'Public',
        private: 'Private',
        actions: 'Actions',
        edit: 'Edit',
        delete: 'Delete',
        confirmDelete: 'Delete this contest?',
        previous: 'Previous',
        next: 'Next',
    },
    ar: {
        title: 'إدارة المسابقات',
        subtitle: (count) => `${count} مسابقة.`,
        newContest: 'مسابقة جديدة',
        createContest: 'إنشاء مسابقة',
        empty: 'لا توجد مسابقات بعد. أنشئ الأولى.',
        tableTitle: 'العنوان',
        slug: 'المعرف',
        visibility: 'الظهور',
        public: 'عامة',
        private: 'خاصة',
        actions: 'الإجراءات',
        edit: 'تعديل',
        delete: 'حذف',
        confirmDelete: 'هل تريد حذف هذه المسابقة؟',
        previous: 'السابق',
        next: 'التالي',
    },
};

export default function AdminContestsIndex() {
    const { locale } = useUiLocale();
    const t = copy[locale];
    const { contests = {}, flash } = usePage().props;
    const rows = contests.data ?? [];
    const count = contests.total ?? rows.length;

    return (
        <AdminLayout
            title={t.title}
            subtitle={t.subtitle(count)}
            actions={
                <Button asChild>
                    <Link href="/admin/contests/create">
                        <Plus data-icon="inline-start" />
                        {t.newContest}
                    </Link>
                </Button>
            }
        >
            {flash?.message ? (
                <Alert className="mb-5 border-emerald-400/20 bg-emerald-400/10">
                    <AlertDescription>{flash.message}</AlertDescription>
                </Alert>
            ) : null}

            <div className="app-surface-muted overflow-hidden rounded-[28px]">
                {rows.length === 0 ? (
                    <div className="flex flex-col items-start gap-4 p-8">
                        <p className="text-sm text-[var(--app-muted)]">{t.empty}</p>
                        <Button asChild>
                            <Link href="/admin/contests/create">{t.createContest}</Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[680px] text-start text-sm">
                                <thead className="border-b border-[var(--app-border)] text-xs text-[var(--app-muted)]">
                                    <tr>
                                        <th className="px-5 py-4 text-start font-medium">{t.tableTitle}</th>
                                        <th className="px-5 py-4 text-start font-medium">{t.slug}</th>
                                        <th className="px-5 py-4 text-start font-medium">{t.visibility}</th>
                                        <th className="px-5 py-4 text-end font-medium">{t.actions}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--app-border)]">
                                    {rows.map((contest) => (
                                        <ContestRow key={contest.id} contest={contest} t={t} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination links={contests.links ?? []} t={t} />
                    </>
                )}
            </div>
        </AdminLayout>
    );
}

function ContestRow({ contest, t }) {
    const deleteForm = useForm({});

    return (
        <tr className="text-[var(--app-foreground)]">
            <td className="px-5 py-4 font-medium">{contest.title}</td>
            <td className="px-5 py-4 font-mono text-xs text-[var(--app-muted)]">{contest.slug}</td>
            <td className="px-5 py-4">
                <Badge variant={contest.is_public ? 'success' : 'muted'}>{contest.is_public ? t.public : t.private}</Badge>
            </td>
            <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                    <Button asChild variant="surface" size="sm">
                        <Link href={`/admin/contests/${contest.id}/edit`}>{t.edit}</Link>
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={deleteForm.processing}
                        onClick={() => {
                            if (confirm(t.confirmDelete)) {
                                deleteForm.delete(`/admin/contests/${contest.id}`);
                            }
                        }}
                    >
                        {t.delete}
                    </Button>
                </div>
            </td>
        </tr>
    );
}

function Pagination({ links, t }) {
    if (!links.length) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2 border-t border-[var(--app-border)] px-5 py-4">
            {links.map((link, index) => (
                <Button key={`${link.label}-${index}`} asChild={Boolean(link.url)} variant={link.active ? 'default' : 'surface'} size="sm" disabled={!link.url}>
                    {link.url ? <Link href={link.url} preserveScroll>{paginationLabel(link.label, t)}</Link> : <span>{paginationLabel(link.label, t)}</span>}
                </Button>
            ))}
        </div>
    );
}

function paginationLabel(label, t) {
    if (label.includes('Previous')) {
        return `« ${t.previous}`;
    }

    if (label.includes('Next')) {
        return `${t.next} »`;
    }

    return label;
}
