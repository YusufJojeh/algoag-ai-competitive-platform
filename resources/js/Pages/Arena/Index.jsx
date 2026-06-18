import { Link, usePage } from '@inertiajs/react';

import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useUiLocale } from '@/lib/ui-locale';

const copy = {
    en: {
        badge: 'Arena',
        title: 'Contests',
        description: 'Compete on timed rounds. Solve problems, climb the standings.',
        empty: 'No contests yet.',
        problems: 'problems',
        running: 'Running',
        upcoming: 'Upcoming',
        ended: 'Ended',
    },
    ar: {
        badge: 'الساحة',
        title: 'المسابقات',
        description: 'تنافس في جولات مؤقتة. حُلّ المسائل وتسلّق الترتيب.',
        empty: 'لا توجد مسابقات بعد.',
        problems: 'مسائل',
        running: 'جارية',
        upcoming: 'قادمة',
        ended: 'منتهية',
    },
};

const statusTone = { running: 'success', upcoming: 'warning', ended: 'muted' };

export default function ArenaIndex() {
    const { contests = [] } = usePage().props;
    const { locale, isRtl } = useUiLocale();
    const t = copy[locale];

    return (
        <AppLayout
            currentPath="/arena"
            badge={t.badge}
            title={t.title}
            description={t.description}
            contentClassName="px-6 py-6"
        >
            <div className="mx-auto max-w-5xl space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
                {contests.length === 0 ? (
                    <Card className="border-dashed bg-slate-950/35 px-6 py-14 text-center">
                        <p className="text-lg font-semibold text-[var(--app-foreground)]">{t.empty}</p>
                    </Card>
                ) : (
                    <ul className="space-y-3">
                        {contests.map((c) => (
                            <li key={c.slug}>
                                <Card>
                                    <CardContent className="p-5">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <Link href={`/arena/${c.slug}`} className="text-lg font-semibold text-cyan-200 hover:underline">
                                                {c.title}
                                            </Link>
                                            <Badge variant={statusTone[c.status]}>{t[c.status]}</Badge>
                                        </div>
                                        {c.description && <p className="mt-2 text-sm text-[var(--app-muted)]">{c.description}</p>}
                                        <p className="mt-3 text-xs text-[var(--app-muted)]">{c.problems_count} {t.problems}</p>
                                    </CardContent>
                                </Card>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}
