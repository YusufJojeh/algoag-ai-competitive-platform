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
        title: 'Problem management',
        subtitle: (count) => `${count} problems in the database.`,
        newProblem: 'New problem',
        createProblem: 'Create problem',
        empty: 'No problems found. Run the database seeder or create the first problem.',
        tableTitle: 'Title',
        slug: 'Slug',
        difficulty: 'Difficulty',
        visibility: 'Visibility',
        public: 'Public',
        contestOnly: 'Contest-only',
        hiddenUntilEnd: 'Hidden until contest ends',
        published: 'Published',
        created: 'Created',
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
        extreme: 'Extreme',
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
        visibility: 'الظهور',
        public: 'عامة',
        contestOnly: 'خاصة بالمسابقة',
        hiddenUntilEnd: 'مخفية حتى نهاية المسابقة',
        published: 'منشورة',
        created: 'تاريخ الإنشاء',
        easy: 'سهل',
        medium: 'متوسط',
        hard: 'صعب',
        extreme: 'شديدة',
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

            <Card className="overflow-hidden bg-slate-950/55">
                {rows.length === 0 ? (
                    <CardContent className="flex flex-col items-start gap-4 p-8">
                        <p className="text-sm text-[var(--app-muted)]">{t.empty}</p>
                        <Button asChild>
                            <Link href="/admin/problems/create">{t.createProblem}</Link>
                        </Button>
                    </CardContent>
                ) : (
                    <>
                        <Table className="min-w-[780px]">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>{t.tableTitle}</TableHead>
                                    <TableHead>{t.slug}</TableHead>
                                    <TableHead>{t.difficulty}</TableHead>
                                    <TableHead>{t.visibility}</TableHead>
                                    <TableHead>{t.published}/{t.created}</TableHead>
                                    <TableHead className="text-end">{t.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((problem) => (
                                    <ProblemRow key={problem.id} problem={problem} t={t} />
                                ))}
                            </TableBody>
                        </Table>
                        <Pagination links={problems.links ?? []} t={t} />
                    </>
                )}
            </Card>
        </AdminLayout>
    );
}

function ProblemRow({ problem, t }) {
    const deleteForm = useForm({});

    return (
        <TableRow>
            <TableCell className="font-medium">{problem.title}</TableCell>
            <TableCell className="font-mono text-xs text-[var(--app-muted)]">{problem.slug}</TableCell>
            <TableCell>
                <Badge variant={difficultyVariant(problem.difficulty)}>{difficultyLabel(problem.difficulty, t)}</Badge>
            </TableCell>
            <TableCell>
                <ProblemVisibilityBadges problem={problem} t={t} />
            </TableCell>
            <TableCell className="text-[var(--app-muted)]">{problemTime(problem, t)}</TableCell>
            <TableCell>
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
            </TableCell>
        </TableRow>
    );
}

function ProblemVisibilityBadges({ problem, t }) {
    if (problem.is_public && problem.published_at) {
        return <Badge variant="success">{t.published}</Badge>;
    }

    if (problem.is_public) {
        return <Badge variant="warning">{t.public}</Badge>;
    }

    if (problem.published_from_contest_id) {
        return (
            <div className="flex flex-wrap gap-2">
                <Badge variant="warning">{t.contestOnly}</Badge>
                <Badge variant="muted">{t.hiddenUntilEnd}</Badge>
            </div>
        );
    }

    return <Badge variant="muted">{t.hiddenUntilEnd}</Badge>;
}

function difficultyLabel(difficulty, t) {
    return t[difficulty] ?? difficulty;
}

function difficultyVariant(difficulty) {
    if (difficulty === 'easy') return 'success';
    if (difficulty === 'medium') return 'warning';
    if (difficulty === 'hard') return 'danger';
    if (difficulty === 'extreme') return 'violet';

    return 'subtle';
}

function problemTime(problem, t) {
    const label = problem.published_at ? t.published : t.created;
    const value = problem.published_at ?? problem.created_at;

    return `${label}: ${formatDate(value)}`;
}

function formatDate(value) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
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
