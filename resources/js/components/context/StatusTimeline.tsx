import { Clock3 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { WorkspaceEvent } from '@/lib/assistant-workspace';
import { useUiLocale } from '@/lib/ui-locale';

type StatusTimelineProps = {
    events: WorkspaceEvent[];
};

export default function StatusTimeline({ events }: StatusTimelineProps) {
    const { locale } = useUiLocale();

    if (events.length === 0) {
        return (
            <div className="rounded-[24px] border border-dashed border-[var(--app-border)] bg-slate-950/45 p-4 text-sm text-[var(--app-muted)]">
                {locale === 'ar' ? 'سيظهر تسلسل الحالات والأحداث التشغيلية هنا أثناء الجلسة.' : 'The runtime status and event timeline will appear here during the session.'}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {events.map((event, index) => (
                <div key={`${event.id}-${index}`} className="flex gap-3 rounded-[22px] border border-[var(--app-border)] bg-slate-950/45 p-4 shadow-sm">
                    <div className="flex flex-col items-center">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--app-accent)]" />
                        <span className="mt-2 h-full w-px bg-violet-300/20" />
                    </div>
                    <div className="flex-1 pb-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-[var(--app-foreground)]">{event.title}</p>
                            <Badge variant="subtle">
                                <Clock3 className="h-3.5 w-3.5" />
                                {event.createdAt}
                            </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">{event.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
