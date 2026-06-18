import { Link, usePage } from '@inertiajs/react';
import { Activity, BookOpen, Bot, Database, FileCode2, Shield, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useUiLocale } from '@/lib/ui-locale';
import AdminLayout from './AdminLayout';

const copy = {
    en: {
        title: 'Admin dashboard',
        subtitle: 'Real management data from users, content, submissions, and AI solution records.',
        newProblem: 'New problem',
        systemSettings: 'System settings',
        stats: {
            users: 'Users',
            admins: 'Admins',
            problems: 'Problems',
            courses: 'Courses',
            submissions: 'Submissions',
            solutions: 'AI solutions',
        },
        recentUsers: 'Recent users',
        recentProblems: 'Recent problems',
        recentSolutions: 'Recent AI solutions',
        noRecords: 'No records yet.',
        admin: 'Admin',
        member: 'Member',
        guest: 'Guest',
        unknown: 'unknown',
    },
    ar: {
        title: 'لوحة الإدارة',
        subtitle: 'بيانات إدارة فعلية من المستخدمين والمحتوى والتسليمات وسجلات حلول الذكاء الاصطناعي.',
        newProblem: 'مسألة جديدة',
        systemSettings: 'إعدادات النظام',
        stats: {
            users: 'المستخدمون',
            admins: 'المشرفون',
            problems: 'المسائل',
            courses: 'المسارات',
            submissions: 'التسليمات',
            solutions: 'حلول الذكاء الاصطناعي',
        },
        recentUsers: 'أحدث المستخدمين',
        recentProblems: 'أحدث المسائل',
        recentSolutions: 'أحدث حلول الذكاء الاصطناعي',
        noRecords: 'لا توجد سجلات بعد.',
        admin: 'مشرف',
        member: 'عضو',
        guest: 'زائر',
        unknown: 'غير معروف',
    },
};

const statIcons = {
    users: Users,
    admins: Shield,
    problems: Database,
    courses: BookOpen,
    submissions: FileCode2,
    solutions: Bot,
};

export default function AdminDashboard() {
    const { locale } = useUiLocale();
    const t = copy[locale];
    const { stats = {}, recentUsers = [], recentProblems = [], recentSolutions = [] } = usePage().props;

    return (
        <AdminLayout
            title={t.title}
            subtitle={t.subtitle}
            actions={
                <>
                    <Button asChild>
                        <Link href="/admin/problems/create">{t.newProblem}</Link>
                    </Button>
                    <Button asChild variant="surface">
                        <Link href="/admin/settings">{t.systemSettings}</Link>
                    </Button>
                </>
            }
        >
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Object.entries(stats).map(([key, value]) => {
                    const Icon = statIcons[key] ?? Activity;

                    return (
                        <Card key={key} className="bg-slate-950/55">
                            <CardContent className="p-5">
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-sm text-[var(--app-muted)]">{t.stats[key] ?? key}</p>
                                <div className="flex size-11 items-center justify-center rounded-[18px] border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
                                    <Icon className="size-5" />
                                </div>
                            </div>
                            <p className="mt-4 text-3xl font-semibold text-[var(--app-foreground)]">{value}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </section>

            <section className="mt-6 grid gap-5 xl:grid-cols-3">
                <RecentPanel title={t.recentUsers} empty={t.noRecords}>
                    {recentUsers.map((user) => (
                        <Row key={user.id} title={user.name} meta={user.email} badge={user.is_admin ? t.admin : t.member} />
                    ))}
                </RecentPanel>
                <RecentPanel title={t.recentProblems} empty={t.noRecords}>
                    {recentProblems.map((problem) => (
                        <Row key={problem.id} title={problem.title} meta={problem.slug} badge={problem.difficulty} />
                    ))}
                </RecentPanel>
                <RecentPanel title={t.recentSolutions} empty={t.noRecords}>
                    {recentSolutions.map((solution) => (
                        <Row key={solution.id} title={solution.user?.name ?? t.guest} meta={solution.solution_language ?? t.unknown} badge={solution.status} />
                    ))}
                </RecentPanel>
            </section>
        </AdminLayout>
    );
}

function RecentPanel({ title, empty, children }) {
    const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

    return (
        <Card className="overflow-hidden bg-slate-950/55">
            <CardHeader className="px-5 py-4">
                <CardTitle className="text-sm">{title}</CardTitle>
            </CardHeader>
            <Separator />
            <div className="flex flex-col">
                {hasChildren ? children : <p className="px-5 py-5 text-sm text-[var(--app-muted)]">{empty}</p>}
            </div>
        </Card>
    );
}

function Row({ title, meta, badge }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-[var(--app-border)] px-5 py-4 last:border-b-0">
            <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--app-foreground)]">{title}</p>
                <p className="mt-1 truncate text-xs text-[var(--app-muted)]">{meta}</p>
            </div>
            {badge ? <Badge variant="subtle">{badge}</Badge> : null}
        </div>
    );
}
