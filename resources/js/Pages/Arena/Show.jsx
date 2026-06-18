import { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';

import AppLayout from '@/components/layout/AppLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        startsIn: 'Starts at',
        remaining: 'Ends in',
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

copy.ar.startsIn = '\u0633\u062a\u0628\u062f\u0623 \u0641\u064a';
copy.ar.remaining = '\u062a\u0646\u062a\u0647\u064a \u0641\u064a';

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
                    {!contest?.is_practice && <ContestCountdown contest={contest} labels={t} />}
                    {!joined && contest?.status !== 'ended' && (
                        <Button type="button" variant="lavender" size="sm" onClick={join}>
                            {t.join}
                        </Button>
                    )}
                </div>

                {!joined && (
                    <Alert className="border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                        <AlertDescription className="text-cyan-100">{t.joinHint}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <section>
                        <CardHeader>
                            <CardTitle>{t.problems}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {problems.length === 0 ? (
                                <p className="text-sm text-[var(--app-muted)]">{t.empty}</p>
                            ) : (
                                <ul className="space-y-2">
                                    {problems.map((p) => (
                                        <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--app-border)] bg-slate-950/55 p-4">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-sm font-semibold text-[var(--app-foreground)]">{p.label}</span>
                                                <span className="text-sm text-slate-200">{p.title}</span>
                                                {p.your_status && (
                                                    <Badge variant={verdictTone(p.your_status)}>{verdictLabel(p.your_status, locale)}</Badge>
                                                )}
                                            </div>
                                            {joined && p.can_open ? (
                                                <Button asChild variant="surface" size="sm">
                                                    <Link href={`/arena/${contest?.slug}/problems/${p.id}`}>{t.open}</Link>
                                                </Button>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </section>
                </Card>
            </div>
        </AppLayout>
    );
}

function ContestCountdown({ contest, labels }) {
    const [nowMs, setNowMs] = useState(null);

    useEffect(() => {
        setNowMs(Date.now());
        const interval = window.setInterval(() => setNowMs(Date.now()), 1000);

        return () => window.clearInterval(interval);
    }, []);

    if (!contest || nowMs === null) {
        return null;
    }

    if (contest.status === 'ended') {
        return <Badge variant="muted">{labels.ended ?? 'Ended'}</Badge>;
    }

    const target = contest.status === 'upcoming' ? contest.starts_at : contest.ends_at;
    if (!target) {
        return null;
    }

    const seconds = Math.max(0, Math.floor((new Date(target).getTime() - nowMs) / 1000));
    const prefix = contest.status === 'upcoming' ? (labels.startsIn ?? 'Starts in') : (labels.remaining ?? 'Remaining');

    return <Badge variant="subtle" suppressHydrationWarning>{prefix}: {formatDuration(seconds)}</Badge>;
}

function formatDuration(totalSeconds) {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
        return `${days}d ${hours}h`;
    }

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m ${seconds}s`;
}
