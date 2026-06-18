import { Link, usePage } from '@inertiajs/react';

import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
                    <Card className="border-dashed bg-slate-950/35 px-6 py-14 text-center">
                        <p className="text-lg font-semibold text-[var(--app-foreground)]">{t.empty}</p>
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>{t.rank}</TableHead>
                                    <TableHead>{t.who}</TableHead>
                                    <TableHead className="text-center">{t.solved}</TableHead>
                                    <TableHead className="text-center">{t.penalty}</TableHead>
                                    {labels.map((l) => (
                                        <TableHead key={l.id} className="text-center font-mono">{l.label}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row) => (
                                    <TableRow key={row.rank}>
                                        <TableCell>{row.rank}</TableCell>
                                        <TableCell className="font-medium text-[var(--app-foreground)]">{row.user_name}</TableCell>
                                        <TableCell className="text-center">{row.solved}</TableCell>
                                        <TableCell className="text-center">{row.penalty}</TableCell>
                                        {labels.map((l) => (
                                            <TableCell key={l.id} className="text-center text-cyan-200">{statusFor(row, l.id)}</TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
