import { Link, usePage } from '@inertiajs/react';

import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';

const copy = {
    en: {
        badge: 'Standings',
        back: 'Back to contest',
        rank: '#',
        who: 'Participant',
        solved: 'Solved',
        penalty: 'Penalty',
        empty: 'No submissions yet.',
    },
    ar: {
        badge: 'الترتيب',
        back: 'العودة إلى المسابقة',
        rank: '#',
        who: 'المشارك',
        solved: 'المحلولة',
        penalty: 'العقوبة',
        empty: 'لا توجد إرسالات بعد.',
    },
};

export default function ArenaStandings() {
    const { contest, labels = [], rows = [] } = usePage().props;
    const { locale, isRtl } = useUiLocale();
    const t = copy[locale];

    const statusFor = (row, problemId) => {
        const cell = row.problems.find((p) => p.problem_id === problemId);
        if (!cell) return '';
        if (cell.accepted) return `+${cell.wrong > 0 ? cell.wrong : ''}`;
        return cell.wrong > 0 ? `-${cell.wrong}` : '';
    };

    return (
        <AppLayout
            currentPath="/arena"
            badge={t.badge}
            title={contest?.title}
            actions={(
                <Button asChild variant="surface" size="sm">
                    <Link href={`/arena/${contest?.slug}`}>{t.back}</Link>
                </Button>
            )}
            contentClassName="px-6 py-6"
        >
            <div className="mx-auto max-w-5xl" dir={isRtl ? 'rtl' : 'ltr'}>
                {rows.length === 0 ? (
                    <div className="rounded-[30px] border border-dashed border-[var(--app-border)] bg-slate-950/35 px-6 py-14 text-center">
                        <p className="text-lg font-semibold text-[var(--app-foreground)]">{t.empty}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-[28px] border border-[var(--app-border)] bg-slate-950/45">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--app-border)] text-[var(--app-muted)]">
                                    <th className="px-4 py-3 text-start">{t.rank}</th>
                                    <th className="px-4 py-3 text-start">{t.who}</th>
                                    <th className="px-4 py-3 text-center">{t.solved}</th>
                                    <th className="px-4 py-3 text-center">{t.penalty}</th>
                                    {labels.map((l) => (
                                        <th key={l.id} className="px-3 py-3 text-center font-mono">{l.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.rank} className="border-b border-[var(--app-border)]/50">
                                        <td className="px-4 py-3">{row.rank}</td>
                                        <td className="px-4 py-3 text-[var(--app-foreground)]">{row.user_name}</td>
                                        <td className="px-4 py-3 text-center">{row.solved}</td>
                                        <td className="px-4 py-3 text-center">{row.penalty}</td>
                                        {labels.map((l) => (
                                            <td key={l.id} className="px-3 py-3 text-center text-cyan-200">{statusFor(row, l.id)}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
