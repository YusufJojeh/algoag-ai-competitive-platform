import { Link, useForm, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
        practice: 'Practice',
        published: 'Problems published',
        pendingPublish: 'Hidden until contest ends',
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
        empty: 'لا توجد مسابقات بعد. أنشئ المسابقة الأولى.',
        tableTitle: 'العنوان',
        slug: 'المعرّف',
        visibility: 'الظهور',
        public: 'عام',
        private: 'خاص',
        practice: 'تدريب',
        published: 'نُشرت المسائل',
        pendingPublish: 'مخفية حتى نهاية المسابقة',
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
            actions={(
                <Button asChild>
                    <Link href="/admin/contests/create">
                        <Plus data-icon="inline-start" />
                        {t.newContest}
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
                    <CardContent className="flex flex-col items-start gap-4 p-8">
                        <p className="text-sm text-[var(--app-muted)]">{t.empty}</p>
                        <Button asChild>
                            <Link href="/admin/contests/create">{t.createContest}</Link>
                        </Button>
                    </CardContent>
                ) : (
                    <>
                        <Table className="min-w-[680px]">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>{t.tableTitle}</TableHead>
                                    <TableHead>{t.slug}</TableHead>
                                    <TableHead>{t.visibility}</TableHead>
                                    <TableHead className="text-end">{t.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((contest) => (
                                    <ContestRow key={contest.id} contest={contest} t={t} />
                                ))}
                            </TableBody>
                        </Table>
                        <Pagination links={contests.links ?? []} t={t} />
                    </>
                )}
            </Card>
        </AdminLayout>
    );
}

function ContestRow({ contest, t }) {
    const deleteForm = useForm({});

    return (
        <TableRow>
            <TableCell className="font-medium">{contest.title}</TableCell>
            <TableCell className="font-mono text-xs text-[var(--app-muted)]">{contest.slug}</TableCell>
            <TableCell>
                <div className="flex flex-wrap gap-2">
                    <Badge variant={contest.is_public ? 'success' : 'muted'}>{contest.is_public ? t.public : t.private}</Badge>
                    {contest.is_practice ? <Badge variant="violet">{t.practice}</Badge> : null}
                    {contest.problems_published_at ? <Badge variant="success">{t.published}</Badge> : <Badge variant="muted">{t.pendingPublish}</Badge>}
                </div>
            </TableCell>
            <TableCell>
                <div className="flex justify-end gap-2">
                    <Button asChild variant="surface" size="sm">
                        <Link href={`/admin/contests/${contest.slug}/edit`}>{t.edit}</Link>
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={deleteForm.processing}
                        onClick={() => {
                            if (confirm(t.confirmDelete)) {
                                deleteForm.delete(`/admin/contests/${contest.slug}`);
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
