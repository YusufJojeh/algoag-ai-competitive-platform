import { useForm, usePage } from '@inertiajs/react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

            <div className="app-surface-muted overflow-hidden rounded-[28px]">
                {rows.length === 0 ? (
                    <p className="p-6 text-sm text-[var(--app-muted)]">{t.empty}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[780px] text-start text-sm">
                            <thead className="border-b border-[var(--app-border)] text-xs text-[var(--app-muted)]">
                                <tr>
                                    <th className="px-5 py-4 text-start font-medium">{t.user}</th>
                                    <th className="px-5 py-4 text-start font-medium">{t.role}</th>
                                    <th className="px-5 py-4 text-start font-medium">{t.sessions}</th>
                                    <th className="px-5 py-4 text-start font-medium">{t.aiSolves}</th>
                                    <th className="px-5 py-4 text-start font-medium">{t.submissions}</th>
                                    <th className="px-5 py-4 text-end font-medium">{t.action}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--app-border)]">
                                {rows.map((user) => (
                                    <UserRow key={user.id} user={user} t={t} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

function UserRow({ user, t }) {
    const form = useForm({ is_admin: !user.is_admin });

    return (
        <tr className="text-[var(--app-foreground)]">
            <td className="px-5 py-4">
                <p className="font-medium">{user.name}</p>
                <p className="mt-1 text-xs text-[var(--app-muted)]">{user.email}</p>
            </td>
            <td className="px-5 py-4">
                <Badge variant={user.is_admin ? 'success' : 'subtle'}>{user.is_admin ? t.admin : t.member}</Badge>
            </td>
            <td className="px-5 py-4">{user.algorithm_sessions_count}</td>
            <td className="px-5 py-4">{user.codeforces_solutions_count}</td>
            <td className="px-5 py-4">{user.submissions_count}</td>
            <td className="px-5 py-4 text-end">
                <Button type="button" variant="surface" size="sm" disabled={form.processing} onClick={() => form.put(`/admin/users/${user.id}`)}>
                    {user.is_admin ? t.removeAdmin : t.makeAdmin}
                </Button>
            </td>
        </tr>
    );
}
