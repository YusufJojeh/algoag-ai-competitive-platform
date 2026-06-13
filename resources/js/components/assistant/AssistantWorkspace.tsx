import type { ReactNode } from 'react';
import { MonitorCog, RefreshCw, Siren } from 'lucide-react';

import AssistantThread from '@/components/assistant/AssistantThread';
import QuickModesBar from '@/components/assistant/QuickModesBar';
import TranscriptComposer from '@/components/assistant/TranscriptComposer';
import WorkspaceHeader from '@/components/assistant/WorkspaceHeader';
import ScreenContextPanel from '@/components/context/ScreenContextPanel';
import AppLayout from '@/components/layout/AppLayout';
import { getStatusMeta, type AssistantMode, type StreamStatus, type ThreadMessage, type WorkspaceEvent } from '@/lib/assistant-workspace';
import { useUiLocale } from '@/lib/ui-locale';

type AssistantWorkspaceProps = {
    mode: AssistantMode;
    onModeChange: (mode: AssistantMode) => void;
    status: StreamStatus;
    sessionId: number | null;
    currentRequestMessageId: number | null;
    messages: ThreadMessage[];
    currentPartialText: string;
    transcript: string;
    language: string;
    isRecording: boolean;
    isBusy: boolean;
    canSubmit: boolean;
    hasCapturedFrame: boolean;
    hasAudioBlob: boolean;
    isFallbackMode: boolean;
    submitError?: string | null;
    isUsingPolling: boolean;
    contextPanel: ReactNode;
    recentEvents: WorkspaceEvent[];
    onTranscriptChange: (value: string) => void;
    onLanguageChange: (value: string) => void;
    onStartSharing: () => void;
    onRefreshCapture: () => void;
    onStartRecording: () => void;
    onStopRecording: () => void;
    onSubmit: () => void;
    onCancel: () => void;
};

export default function AssistantWorkspace({
    mode,
    onModeChange,
    status,
    sessionId,
    currentRequestMessageId,
    messages,
    currentPartialText,
    transcript,
    language,
    isRecording,
    isBusy,
    canSubmit,
    hasCapturedFrame,
    hasAudioBlob,
    isFallbackMode,
    submitError,
    isUsingPolling,
    contextPanel,
    recentEvents,
    onTranscriptChange,
    onLanguageChange,
    onStartSharing,
    onRefreshCapture,
    onStartRecording,
    onStopRecording,
    onSubmit,
    onCancel,
}: AssistantWorkspaceProps) {
    const { locale } = useUiLocale();
    const statusMeta = getStatusMeta(status, locale);

    return (
        <div data-testid="assistant-workspace-shell">
            <AppLayout
                contextPanel={contextPanel}
                renderHeader={({ openSidebar }) => (
                    <WorkspaceHeader
                        status={status}
                        sessionId={sessionId}
                        activeMode={mode}
                        isUsingPolling={isUsingPolling}
                        onOpenSidebar={openSidebar}
                    />
                )}
            >
                <div className="flex h-full min-h-0 flex-col">
                    <div className="border-b border-[var(--app-border)] bg-slate-950/55 px-4 py-5 sm:px-6">
                        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
                            <div className="min-w-0 flex-1">
                                <QuickModesBar selectedMode={mode} onModeChange={onModeChange} disabled={isBusy} />
                            </div>
                            <div className="hidden shrink-0 items-stretch gap-2 lg:flex 2xl:items-center">
                                <div className="rounded-[22px] border border-[var(--app-border)] bg-slate-950/45 px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--app-muted)]">
                                        <MonitorCog className="h-4 w-4" />
                                        {locale === 'ar' ? 'آخر دورة' : 'Last run'}
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-[var(--app-foreground)]">
                                        {currentRequestMessageId
                                            ? (locale === 'ar' ? `طلب #${currentRequestMessageId}` : `Request #${currentRequestMessageId}`)
                                            : (locale === 'ar' ? 'لم تبدأ بعد' : 'Not started yet')}
                                    </p>
                                </div>
                                <div className="rounded-[22px] border border-[var(--app-border)] bg-slate-950/45 px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--app-muted)]">
                                        <RefreshCw className="h-4 w-4" />
                                        {locale === 'ar' ? 'حالة التشغيل' : 'Runtime status'}
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-[var(--app-foreground)]">{statusMeta.label}</p>
                                </div>
                                <div className="rounded-[22px] border border-[var(--app-border)] bg-slate-950/45 px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--app-muted)]">
                                        <Siren className="h-4 w-4" />
                                        {locale === 'ar' ? 'البث' : 'Transport'}
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-[var(--app-foreground)]">
                                        {isUsingPolling ? (locale === 'ar' ? 'استطلاع احتياطي' : 'Polling fallback') : (locale === 'ar' ? 'لحظي' : 'Realtime')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1">
                        <AssistantThread
                            messages={messages}
                            currentPartialText={currentPartialText}
                            status={status}
                            loading={isBusy}
                            onStartSharing={onStartSharing}
                            recentEvents={recentEvents}
                        />
                    </div>

                    <TranscriptComposer
                        transcript={transcript}
                        language={language}
                        selectedMode={mode}
                        isRecording={isRecording}
                        isBusy={isBusy}
                        canSubmit={canSubmit}
                        hasCapturedFrame={hasCapturedFrame}
                        hasAudioBlob={hasAudioBlob}
                        isFallbackMode={isFallbackMode}
                        error={submitError}
                        onTranscriptChange={onTranscriptChange}
                        onLanguageChange={onLanguageChange}
                        onRefreshCapture={onRefreshCapture}
                        onStartRecording={onStartRecording}
                        onStopRecording={onStopRecording}
                        onSubmit={onSubmit}
                        onCancel={onCancel}
                    />
                </div>
            </AppLayout>
        </div>
    );
}
