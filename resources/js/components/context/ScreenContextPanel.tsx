import { useMemo, useState } from 'react';
import { FileAudio2, FileStack, MicVocal, MonitorPlay, RadioTower, RefreshCcwDot } from 'lucide-react';

import AudioReplyPlayer from '@/components/context/AudioReplyPlayer';
import ContextPanelHeader from '@/components/context/ContextPanelHeader';
import LiveCapturePreview from '@/components/context/LiveCapturePreview';
import StatusTimeline from '@/components/context/StatusTimeline';
import EmptyState from '@/components/shared/EmptyState';
import LoadingState from '@/components/shared/LoadingState';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { formatLanguageLabel, getModeMeta, getStatusMeta, type AssistantMode, type StreamStatus, type WorkspaceEvent } from '@/lib/assistant-workspace';
import { useUiLocale } from '@/lib/ui-locale';

type ScreenContextPanelProps = {
    isSharing: boolean;
    stream: MediaStream | null;
    capturedFrame?: Blob | null;
    previewSrc?: string | null;
    transcript: string;
    language: string;
    selectedMode: AssistantMode;
    status: StreamStatus;
    sessionId: number | null;
    currentRequestMessageId: number | null;
    isUsingPolling: boolean;
    audioUrl?: string | null;
    error?: string | null;
    events: WorkspaceEvent[];
    onStartSharing: () => void;
    onRefreshCapture: () => void;
    onRestartSession: () => void;
    onReconnect: () => void;
    onExpandPreview: () => void;
};

export default function ScreenContextPanel({
    isSharing,
    stream,
    capturedFrame,
    previewSrc,
    transcript,
    language,
    selectedMode,
    status,
    sessionId,
    currentRequestMessageId,
    isUsingPolling,
    audioUrl,
    error,
    events,
    onStartSharing,
    onRefreshCapture,
    onRestartSession,
    onReconnect,
    onExpandPreview,
}: ScreenContextPanelProps) {
    const { locale } = useUiLocale();
    const [activeTab, setActiveTab] = useState('capture');

    const statusMeta = getStatusMeta(status, locale);
    const modeMeta = getModeMeta(selectedMode, locale);
    const captureSize = useMemo(() => {
        if (!capturedFrame) {
            return null;
        }

        return `${(capturedFrame.size / 1024).toFixed(0)} KB`;
    }, [capturedFrame]);

    return (
        <section className="app-surface-strong flex min-h-[380px] flex-col overflow-hidden rounded-[32px]" data-testid="screen-context-panel">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full min-h-0 flex-col">
                <ContextPanelHeader
                    onRestart={onRestartSession}
                    onRefresh={onRefreshCapture}
                    onReconnect={onReconnect}
                    onExpand={onExpandPreview}
                />

                <ScrollArea className="h-full flex-1 px-5 py-5 app-scroll">
                    <TabsContent value="capture" className="space-y-4">
                        <LiveCapturePreview
                            isSharing={isSharing}
                            stream={stream}
                            isBusy={status !== 'idle'}
                            capturedFrame={capturedFrame}
                            previewSrc={previewSrc}
                            error={error}
                            onStartSharing={onStartSharing}
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                            <MetaCard label={locale === 'ar' ? 'وضع المساعدة' : 'Assistant mode'} value={modeMeta.label} icon={MonitorPlay} />
                            <MetaCard label={locale === 'ar' ? 'آخر إطار' : 'Last frame'} value={captureSize ?? (locale === 'ar' ? 'غير متوفر' : 'Unavailable')} icon={RefreshCcwDot} />
                        </div>
                    </TabsContent>

                    <TabsContent value="transcript" className="space-y-4">
                        {transcript ? (
                            <div className="rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-5 shadow-sm">
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--app-foreground)]">
                                        <MicVocal className="h-4 w-4 text-[var(--app-accent-strong)]" />
                                        {locale === 'ar' ? 'النص الحالي' : 'Current transcript'}
                                    </div>
                                    <Badge variant="subtle">{formatLanguageLabel(language, locale)}</Badge>
                                </div>
                                <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--app-foreground)]">{transcript}</p>
                            </div>
                        ) : (
                            <EmptyState
                                icon={MicVocal}
                                title={locale === 'ar' ? 'لا يوجد نص جاهز بعد' : 'No transcript yet'}
                                description={
                                    locale === 'ar'
                                        ? 'عند التسجيل أو الكتابة في المؤلف سيظهر النص هنا كما يراه الخادم قبل التحليل.'
                                        : 'When you record or type in the composer, the transcript will appear here exactly as the server receives it before analysis.'
                                }
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="analysis" className="space-y-4">
                        {status === 'idle' && !sessionId ? (
                            <EmptyState
                                icon={FileStack}
                                title={locale === 'ar' ? 'لم تبدأ دورة تحليل بعد' : 'No analysis run yet'}
                                description={
                                    locale === 'ar'
                                        ? 'بعد إرسال الإطار والنص، ستظهر هنا حالة المعالجة، رقم الجلسة، ومعطيات التشغيل.'
                                        : 'After sending the frame and transcript, processing status, session id, and runtime details will appear here.'
                                }
                            />
                        ) : (
                            <>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <MetaCard label={locale === 'ar' ? 'الحالة' : 'Status'} value={statusMeta.label} icon={RadioTower} />
                                    <MetaCard label={locale === 'ar' ? 'الجلسة' : 'Session'} value={sessionId ? `#${sessionId}` : (locale === 'ar' ? 'جديدة' : 'New')} icon={FileStack} />
                                    <MetaCard label={locale === 'ar' ? 'الطلب الحالي' : 'Current request'} value={currentRequestMessageId ? `#${currentRequestMessageId}` : (locale === 'ar' ? 'غير متاح' : 'Unavailable')} icon={FileStack} />
                                    <MetaCard label={locale === 'ar' ? 'النقل' : 'Transport'} value={isUsingPolling ? (locale === 'ar' ? 'استطلاع احتياطي' : 'Polling fallback') : 'WebSocket'} icon={MonitorPlay} />
                                </div>
                                {status !== 'completed' && status !== 'idle' ? <LoadingState compact lines={3} /> : null}
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="events" className="space-y-4">
                        <StatusTimeline events={events} />
                    </TabsContent>

                    <TabsContent value="audio" className="space-y-4">
                        <AudioReplyPlayer src={audioUrl} />
                        {!audioUrl && <LoadingState compact lines={2} />}
                    </TabsContent>
                </ScrollArea>
            </Tabs>
        </section>
    );
}

type MetaCardProps = {
    icon: typeof MonitorPlay;
    label: string;
    value: string;
};

function MetaCard({ icon: Icon, label, value }: MetaCardProps) {
    return (
        <div className="rounded-[24px] border border-[var(--app-border)] bg-slate-950/45 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--app-muted)]">
                <Icon className="h-3.5 w-3.5" />
                {label}
            </div>
            <p className="mt-2 text-sm font-semibold text-[var(--app-foreground)]">{value}</p>
        </div>
    );
}
