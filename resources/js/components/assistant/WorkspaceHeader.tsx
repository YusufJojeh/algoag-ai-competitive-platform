import { Menu, RefreshCw, Sparkles, WandSparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getModeMeta, getStatusMeta, type AssistantMode, type StreamStatus } from '@/lib/assistant-workspace';
import { useUiLocale } from '@/lib/ui-locale';

type WorkspaceHeaderProps = {
    status: StreamStatus;
    sessionId: number | null;
    activeMode: AssistantMode;
    isUsingPolling: boolean;
    onOpenSidebar: () => void;
    onSelectMode: (mode: AssistantMode) => void;
};

export default function WorkspaceHeader({
    status,
    sessionId,
    activeMode,
    isUsingPolling,
    onOpenSidebar,
    onSelectMode,
}: WorkspaceHeaderProps) {
    const { locale } = useUiLocale();
    const statusMeta = getStatusMeta(status, locale);
    const modeMeta = getModeMeta(activeMode, locale);

    return (
        <div className="sticky top-0 z-20 border-b border-[var(--app-border)] bg-slate-950/85 px-6 py-5 backdrop-blur">
            <div className="mx-auto flex w-full max-w-4xl items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <Button type="button" variant="surface" size="icon" className="xl:hidden" onClick={onOpenSidebar}>
                        <Menu className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-semibold text-[var(--app-foreground)]">
                                {locale === 'ar' ? 'مساحة المساعد الصوتي والبصري' : 'Voice and Vision assistant workspace'}
                            </h1>
                            <Badge variant="app">{statusMeta.label}</Badge>
                            {sessionId && <Badge variant="subtle">{locale === 'ar' ? `جلسة #${sessionId}` : `Session #${sessionId}`}</Badge>}
                        </div>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
                            {locale === 'ar'
                                ? 'شارك شاشة المسألة أو المحرر، ثم قدّم فكرتك ليحللها المساعد كموجّه تعليمي متدرج.'
                                : 'Share the problem or editor screen, then submit your idea so the assistant can review it as a guided tutor.'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="soft" size="sm" onClick={() => onSelectMode('hint')}>
                            <Sparkles className="h-4 w-4" />
                            {locale === 'ar' ? 'أعطني تلميحاً' : 'Give me a hint'}
                        </Button>
                        <Button type="button" variant="surface" size="sm" onClick={() => onSelectMode('idea_check')}>
                            <RefreshCw className="h-4 w-4" />
                            {locale === 'ar' ? 'راجع الفكرة' : 'Review the idea'}
                        </Button>
                    </div>
                    <p className="text-xs text-[var(--app-muted)]">
                        {locale === 'ar' ? 'الوضع الحالي:' : 'Current mode:'}{' '}
                        <span className="font-medium text-[var(--app-muted-strong)]">{modeMeta.label}</span>
                        {isUsingPolling && (locale === 'ar' ? ' · يعمل عبر الاستطلاع الاحتياطي' : ' · running on polling fallback')}
                        {!isUsingPolling && (locale === 'ar' ? ' · البث اللحظي متصل' : ' · realtime connected')}
                    </p>
                </div>
            </div>
        </div>
    );
}
