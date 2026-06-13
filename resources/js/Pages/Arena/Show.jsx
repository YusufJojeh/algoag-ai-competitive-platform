import { Link, router, usePage } from '@inertiajs/react';

import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';
import { verdictLabel, verdictTone } from '@/lib/verdicts';

const copy = {
    en: {
        badge: 'Contest',
        standings: 'Standings',
        problems: 'Problems',
        empty: 'No problems in this contest yet.',
        open: 'Open',
        practice: 'Practice mode',
        running: 'Running',
        upcoming: 'Not started',
        ended: 'Ended',
        join: 'Join contest',
        joinHint: 'Join the contest to access its problems and submit.',
        closed: 'This contest is not accepting submissions right now.',
    },
    ar: {
        badge: 'مسابقة',
        standings: 'الترتيب',
        problems: 'المسائل',
        empty: 'لا توجد مسائل في هذه المسابقة بعد.',
        open: 'فتح',
        practice: 'وضع التدريب',
        running: 'جارية',
        upcoming: 'لم تبدأ',
        ended: 'منتهية',
        join: 'الانضمام إلى المسابقة',
        joinHint: 'انضم إلى المسابقة للوصول إلى مسائلها والإرسال.',
        closed: 'المسابقة لا تقبل الإرسالات حالياً.',
    },
};

const statusTone = { running: 'success', upcoming: 'warning', ended: 'muted' };

export default function ArenaShow() {
    const { contest, problems = [], joined = false } = usePage().props;
    const { locale, isRtl } = useUiLocale();
    const t = copy[locale];

    const join = () => {
        router.post(`/arena/${contest?.slug}/join`, {}, { preserveScroll: true });
    };

    return (
        <AppLayout
            currentPath="/arena"
            badge={t.badge}
            title={contest?.title}
            description={contest?.description}
            actions={(
                <Button asChild variant="soft" size="sm">
                    <Link href={`/arena/${contest?.slug}/standings`}>{t.standings}</Link>
                </Button>
            )}
            contentClassName="px-6 py-6"
        >
            <div className="mx-auto max-w-5xl space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="flex flex-wrap items-center gap-2">
                    {contest?.is_practice ? (
                        <Badge variant="violet">{t.practice}</Badge>
                    ) : (
                        <Badge variant={statusTone[contest?.status]}>{t[contest?.status] ?? contest?.status}</Badge>
                    )}
                    {!joined && (
                        <Button type="button" variant="lavender" size="sm" onClick={join}>
                            {t.join}
                        </Button>
                    )}
                </div>

                {!joined && (
                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
                        {t.joinHint}
                    </div>
                )}

                <section className="rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-5">
                    <h2 className="mb-3 text-lg font-semibold text-[var(--app-foreground)]">{t.problems}</h2>
                    {problems.length === 0 ? (
                        <p className="text-sm text-[var(--app-muted)]">{t.empty}</p>
                    ) : (
                        <ul className="space-y-2">
                            {problems.map((p) => (
                                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--app-border)] bg-slate-950/55 p-4">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-sm font-semibold text-[var(--app-foreground)]">{p.label}</span>
                                        <span className="text-sm text-slate-200">{p.title}</span>
                                        <Badge variant="subtle">{p.difficulty}</Badge>
                                        {p.your_status && (
                                            <Badge variant={verdictTone(p.your_status)}>{verdictLabel(p.your_status, locale)}</Badge>
                                        )}
                                    </div>
                                    {joined ? (
                                        <Button asChild variant="surface" size="sm">
                                            <Link href={`/problems/${p.slug}?contest=${contest?.slug}`}>{t.open}</Link>
                                        </Button>
                                    ) : (
                                        <Button type="button" variant="surface" size="sm" disabled>
                                            {t.open}
                                        </Button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
