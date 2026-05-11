import { Expand, PlugZap, RefreshCcw, RotateCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUiLocale } from '@/lib/ui-locale';

type ContextPanelHeaderProps = {
    onRestart: () => void;
    onRefresh: () => void;
    onReconnect: () => void;
    onExpand: () => void;
};

export default function ContextPanelHeader({
    onRestart,
    onRefresh,
    onReconnect,
    onExpand,
}: ContextPanelHeaderProps) {
    const { locale } = useUiLocale();

    return (
        <div className="sticky top-0 z-10 space-y-4 border-b border-[var(--app-border)] bg-[rgba(255,255,255,0.95)] px-5 py-4 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-[var(--app-foreground)]">{locale === 'ar' ? 'لوحة السياق الحي' : 'Live context panel'}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
                        {locale === 'ar' ? 'المعاينة، النسخ، الأحداث، والصوت في مكان واحد.' : 'Preview, transcript, events, and audio in one place.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="surface" size="icon" onClick={onRestart}>
                        <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="surface" size="icon" onClick={onRefresh}>
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="surface" size="icon" onClick={onReconnect}>
                        <PlugZap className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="surface" size="icon" onClick={onExpand}>
                        <Expand className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <TabsList className="grid h-auto w-full grid-cols-5 rounded-[22px] bg-[rgba(248,246,255,0.96)]">
                <TabsTrigger value="capture" className="rounded-[16px]">
                    {locale === 'ar' ? 'الالتقاط الحي' : 'Live capture'}
                </TabsTrigger>
                <TabsTrigger value="transcript" className="rounded-[16px]">
                    {locale === 'ar' ? 'النص' : 'Transcript'}
                </TabsTrigger>
                <TabsTrigger value="analysis" className="rounded-[16px]">
                    {locale === 'ar' ? 'التحليل' : 'Analysis'}
                </TabsTrigger>
                <TabsTrigger value="events" className="rounded-[16px]">
                    {locale === 'ar' ? 'الأحداث' : 'Events'}
                </TabsTrigger>
                <TabsTrigger value="audio" className="rounded-[16px]">
                    {locale === 'ar' ? 'الصوت' : 'Audio'}
                </TabsTrigger>
            </TabsList>
        </div>
    );
}
