import { useForm, usePage } from '@inertiajs/react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUiLocale } from '@/lib/ui-locale';
import AdminLayout from '../AdminLayout';

const copy = {
    en: {
        title: 'User management',
        subtitle: 'Manage admin access and review user activity.',
        user: 'User',
        role: 'Role',
        sessions: 'Sessions',
        aiSolves: 'AI solves',
        submissions: 'Submissions',
        action: 'Action',
        admin: 'Admin',
        member: 'Member',
        makeAdmin: 'Make admin',
        removeAdmin: 'Remove admin',
        empty: 'No users found.',
    },
    ar: {
        title: 'إدارة المستخدمين',
        subtitle: 'إدارة صلاحيات المشرفين ومراجعة نشاط المستخدمين.',
        user: 'المستخدم',
        role: 'الدور',
        sessions: 'الجلسات',
        aiSolves: 'حلول الذكاء الاصطناعي',
        submissions: 'التسليمات',
        action: 'الإجراء',
        admin: 'مشرف',
        member: 'عضو',
        makeAdmin: 'اجعله مشرفا',
        removeAdmin: 'إزالة الإشراف',
        empty: 'لا يوجد مستخدمون.',
    },
};

export default function AdminUsersIndex() {
    const { locale } = useUiLocale();
    const t = copy[locale];
    const { users = {}, flash } = usePage().props;
    const rows = users.data ?? [];

    return (
        <AdminLayout title={t.title} subtitle={t.subtitle}>
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
                    <Table className="min-w-[780px]">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>{t.user}</TableHead>
                                <TableHead>{t.role}</TableHead>
                                <TableHead>{t.sessions}</TableHead>
                                <TableHead>{t.aiSolves}</TableHead>
                                <TableHead>{t.submissions}</TableHead>
                                <TableHead className="text-end">{t.action}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((user) => (
                                <UserRow key={user.id} user={user} t={t} />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </AdminLayout>
    );
}

function UserRow({ user, t }) {
    const form = useForm({ is_admin: !user.is_admin });

    return (
        <TableRow>
            <TableCell>
                <p className="font-medium">{user.name}</p>
                <p className="mt-1 text-xs text-[var(--app-muted)]">{user.email}</p>
            </TableCell>
            <TableCell>
                <Badge variant={user.is_admin ? 'success' : 'subtle'}>{user.is_admin ? t.admin : t.member}</Badge>
            </TableCell>
            <TableCell>{user.algorithm_sessions_count}</TableCell>
            <TableCell>{user.codeforces_solutions_count}</TableCell>
            <TableCell>{user.submissions_count}</TableCell>
            <TableCell className="text-end">
                <Button type="button" variant="surface" size="sm" disabled={form.processing} onClick={() => form.put(`/admin/users/${user.id}`)}>
                    {user.is_admin ? t.removeAdmin : t.makeAdmin}
                </Button>
            </TableCell>
        </TableRow>
    );
}
