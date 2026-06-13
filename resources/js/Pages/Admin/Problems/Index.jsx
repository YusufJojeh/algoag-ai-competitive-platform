import { Link, useForm, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';
import AdminLayout from '../AdminLayout';

const copy = {
    en: {
        title: 'Problem management',
        subtitle: (count) => `${count} problems in the database.`,
        newProblem: 'New problem',
        createProblem: 'Create problem',
        empty: 'No problems found. Run the database seeder or create the first problem.',
        tableTitle: 'Title',
        slug: 'Slug',
        difficulty: 'Difficulty',
        created: 'Created',
        actions: 'Actions',
        edit: 'Edit',
        delete: 'Delete',
        confirmDelete: 'Delete this problem?',
        previous: 'Previous',
        next: 'Next',
    },
    ar: {
        title: 'إدارة المسائل',
        subtitle: (count) => `${count} مسألة في قاعدة البيانات.`,
        newProblem: 'مسألة جديدة',
        createProblem: 'إنشاء مسألة',
        empty: 'لا توجد مسائل. شغل بيانات البذور أو أنشئ المسألة الأولى.',
        tableTitle: 'العنوان',
        slug: 'المعرف',
        difficulty: 'الصعوبة',
        created: 'تاريخ الإنشاء',
        actions: 'الإجراءات',
        edit: 'تعديل',
        delete: 'حذف',
        confirmDelete: 'هل تريد حذف هذه المسألة؟',
        previous: 'السابق',
        next: 'التالي',
    },
};

export default function AdminProblemsIndex() {
    const { locale } = useUiLocale();
    const t = copy[locale];
    const { problems = {}, flash } = usePage().props;
    const rows = problems.data ?? [];
    const count = problems.total ?? rows.length;

    return (
        <AdminLayout
            title={t.title}
            subtitle={t.subtitle(count)}
            actions={
                <Button asChild>
                    <Link href="/admin/problems/create">
                        <Plus data-icon="inline-start" />
                        {t.newProblem}
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
                            <Link href="/admin/problems/create">{t.createProblem}</Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[780px] text-start text-sm">
                                <thead className="border-b border-[var(--app-border)] text-xs text-[var(--app-muted)]">
                                    <tr>
                                        <th className="px-5 py-4 text-start font-medium">{t.tableTitle}</th>
                                        <th className="px-5 py-4 text-start font-medium">{t.slug}</th>
                                        <th className="px-5 py-4 text-start font-medium">{t.difficulty}</th>
                                        <th className="px-5 py-4 text-start font-medium">{t.created}</th>
                                        <th className="px-5 py-4 text-end font-medium">{t.actions}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--app-border)]">
                                    {rows.map((problem) => (
                                        <ProblemRow key={problem.id} problem={problem} t={t} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination links={problems.links ?? []} t={t} />
                    </>
                )}
            </div>
        </AdminLayout>
    );
}

function ProblemRow({ problem, t }) {
    const deleteForm = useForm({});

    return (
        <tr className="text-[var(--app-foreground)]">
            <td className="px-5 py-4 font-medium">{problem.title}</td>
            <td className="px-5 py-4 font-mono text-xs text-[var(--app-muted)]">{problem.slug}</td>
            <td className="px-5 py-4">
                <Badge variant="subtle">{problem.difficulty}</Badge>
            </td>
            <td className="px-5 py-4 text-[var(--app-muted)]">{problem.created_at ? new Date(problem.created_at).toLocaleDateString() : '-'}</td>
            <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                    <Button asChild variant="surface" size="sm">
                        <Link href={`/admin/problems/${problem.id}/edit`}>{t.edit}</Link>
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={deleteForm.processing}
                        onClick={() => {
                            if (confirm(t.confirmDelete)) {
                                deleteForm.delete(`/admin/problems/${problem.id}`);
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
