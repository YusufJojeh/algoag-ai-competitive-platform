import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';

import AssistantWorkspace from '@/components/assistant/AssistantWorkspace';
import ScreenContextPanel from '@/components/context/ScreenContextPanel';
import {
    getStatusMeta,
    type AssistantMode,
    type StreamStatus,
    type ThreadMessage,
    type TimelineTone,
    type WorkspaceEvent,
} from '@/lib/assistant-workspace';
import { getAssistantVisualScenario, type AssistantVisualScenarioName } from '@/lib/e2e-visual';
import { getSpeechLanguage, useUiLocale } from '@/lib/ui-locale';
import useAssistantStream from '../hooks/useAssistantStream';
import useScreenCapture from '../hooks/useScreenCapture';
import useVoiceInput from '../hooks/useVoiceInput';

const BUSY_STATUSES: StreamStatus[] = ['queued', 'transcribing', 'analyzing', 'tts_generating'];

type AssistantPageProps = {
    auth?: {
        user?: {
            id: number;
            name: string;
            email: string;
            is_admin: boolean;
        } | null;
    };
    e2e?: {
        scenario?: AssistantVisualScenarioName;
        mode?: AssistantMode | null;
    };
};

export default function Assistant() {
    const page = usePage<AssistantPageProps>();

    if (page.props.e2e?.scenario) {
        return <AssistantVisualPage scenarioName={page.props.e2e.scenario} modeOverride={page.props.e2e.mode ?? null} />;
    }

    return <RealAssistantPage userId={page.props.auth?.user?.id ?? null} />;
}

type RealAssistantPageProps = {
    userId: number | null;
};

function RealAssistantPage({ userId }: RealAssistantPageProps) {
    const { locale } = useUiLocale();
    const screen = useScreenCapture();
    const voice = useVoiceInput(getSpeechLanguage(locale));
    const stream = useAssistantStream(userId ?? undefined);

    const [mode, setMode] = useState<AssistantMode>('idea_check');
    const [capturedFrame, setCapturedFrame] = useState<Blob | null>(null);
    const [messages, setMessages] = useState<ThreadMessage[]>([]);
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [currentRequestMessageId, setCurrentRequestMessageId] = useState<number | null>(null);
    const [currentRequestMode, setCurrentRequestMode] = useState<AssistantMode>('idea_check');
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [events, setEvents] = useState<WorkspaceEvent[]>([]);

    const status = (stream.status ?? 'idle') as StreamStatus;
    const isBusy = BUSY_STATUSES.includes(status);
    // Frame is optional: allow text-only submit (pasted problem text) as well as screen-context submit
    const hasInput = Boolean(voice.transcript.trim() || voice.audioBlob);
    const canSubmit = hasInput;

    const eventCounterRef = useRef(0);
    const previousSharingRef = useRef(false);
    const previousCaptureRef = useRef<Blob | null>(null);
    const previousStatusRef = useRef<StreamStatus>('idle');
    const previousAudioUrlRef = useRef<string | null>(null);
    const previousPollingRef = useRef(false);
    const previousErrorRef = useRef<string | null>(null);

    const appendEvent = useCallback((title: string, description: string, tone: TimelineTone = 'neutral') => {
        eventCounterRef.current += 1;
        const time = new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
            hour: 'numeric',
            minute: '2-digit',
        }).format(new Date());

        setEvents((previous) => [
            {
                id: `event-${eventCounterRef.current}`,
                title,
                description,
                tone,
                createdAt: time,
            },
            ...previous,
        ].slice(0, 24));
    }, [locale]);

    useEffect(() => {
        appendEvent(
            locale === 'ar' ? 'المساحة جاهزة' : 'Workspace ready',
            locale === 'ar'
                ? 'يمكنك بدء مشاركة الشاشة أو مراجعة جلسة المساعد الحالية.'
                : 'You can start screen sharing or review the current assistant session.',
            'neutral'
        );
    }, [appendEvent, locale]);

    useEffect(() => {
        if (stream.fullText && currentRequestMessageId) {
            setMessages((previous) => {
                const assistantId = `assistant-${currentRequestMessageId}`;
                const existing = previous.find((item) => item.id === assistantId);

                if (existing) {
                    return previous.map((item) => (
                        item.id === assistantId
                            ? { ...item, content: stream.fullText, audioUrl: stream.audioUrl ?? item.audioUrl }
                            : item
                    ));
                }

                return [
                    ...previous,
                    {
                        id: assistantId,
                        role: 'assistant',
                        content: stream.fullText,
                        mode: currentRequestMode,
                        audioUrl: stream.audioUrl,
                    },
                ];
            });
        }
    }, [stream.fullText, stream.audioUrl, currentRequestMessageId, currentRequestMode]);

    useEffect(() => {
        if (stream.audioUrl && currentRequestMessageId) {
            setMessages((previous) => previous.map((item) => (
                item.id === `assistant-${currentRequestMessageId}`
                    ? { ...item, audioUrl: stream.audioUrl }
                    : item
            )));
        }
    }, [stream.audioUrl, currentRequestMessageId]);

    useEffect(() => {
        if (screen.isSharing && !previousSharingRef.current) {
            appendEvent(
                locale === 'ar' ? 'بدأت مشاركة الشاشة' : 'Screen sharing started',
                locale === 'ar'
                    ? 'يمكن الآن معاينة المسألة أو المحرر من لوحة السياق الحي.'
                    : 'The problem or editor can now be previewed from the live context panel.',
                'success'
            );
        }

        if (!screen.isSharing && previousSharingRef.current) {
            appendEvent(
                locale === 'ar' ? 'تم إيقاف المشاركة' : 'Sharing stopped',
                locale === 'ar'
                    ? 'المساعد يحتفظ بآخر إطار محفوظ فقط حتى تستأنف المشاركة.'
                    : 'The assistant is keeping only the last saved frame until sharing resumes.',
                'warning'
            );
        }

        previousSharingRef.current = screen.isSharing;
    }, [screen.isSharing, appendEvent, locale]);

    useEffect(() => {
        if (capturedFrame && capturedFrame !== previousCaptureRef.current) {
            appendEvent(
                locale === 'ar' ? 'تم تحديث الإطار الحالي' : 'Current frame refreshed',
                locale === 'ar'
                    ? `حجم الإطار المرسل للمساعد ${(capturedFrame.size / 1024).toFixed(0)} كيلوبايت.`
                    : `Frame size sent to the assistant: ${(capturedFrame.size / 1024).toFixed(0)} KB.`,
                'accent'
            );
        }

        previousCaptureRef.current = capturedFrame;
    }, [capturedFrame, appendEvent, locale]);

    useEffect(() => {
        if (status !== previousStatusRef.current) {
            const meta = getStatusMeta(status, locale);

            if (status !== 'idle') {
                appendEvent(meta.label, meta.description, meta.tone);
            }

            previousStatusRef.current = status;
        }
    }, [status, appendEvent, locale]);

    useEffect(() => {
        if (stream.audioUrl && stream.audioUrl !== previousAudioUrlRef.current) {
            appendEvent(
                locale === 'ar' ? 'الرد الصوتي جاهز' : 'Audio reply ready',
                locale === 'ar'
                    ? 'يمكنك الآن تشغيل الصياغة الصوتية للرد من لوحة السياق.'
                    : 'You can now play the spoken version of the reply from the context panel.',
                'success'
            );
            previousAudioUrlRef.current = stream.audioUrl;
        }
    }, [stream.audioUrl, appendEvent, locale]);

    useEffect(() => {
        if (stream.isUsingPolling && !previousPollingRef.current) {
            appendEvent(
                locale === 'ar' ? 'تم التبديل إلى الاستطلاع الاحتياطي' : 'Switched to polling fallback',
                locale === 'ar'
                    ? 'البث الفوري غير متاح حالياً، لذا ستتم متابعة الحالة عبر polling.'
                    : 'Realtime streaming is unavailable, so status updates will continue through polling.',
                'warning'
            );
        }

        previousPollingRef.current = stream.isUsingPolling;
    }, [stream.isUsingPolling, appendEvent, locale]);

    useEffect(() => {
        if (stream.error && stream.error !== previousErrorRef.current) {
            setSubmitError(stream.error);
            appendEvent(locale === 'ar' ? 'تعذر إكمال الدورة الحالية' : 'Unable to complete the current run', stream.error, 'danger');
            previousErrorRef.current = stream.error;
        }
    }, [stream.error, appendEvent, locale]);

    const refreshCapture = useCallback(async () => {
        try {
            const blob = await screen.captureFrame();
            setCapturedFrame(blob);
            setSubmitError(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : (locale === 'ar' ? 'تعذر تحديث الإطار الحالي.' : 'Unable to refresh the current frame.');
            setSubmitError(message);
            appendEvent(locale === 'ar' ? 'فشل تحديث الإطار' : 'Frame refresh failed', message, 'danger');
        }
    }, [screen, appendEvent, locale]);

    const handleStartSharing = useCallback(async () => {
        await screen.startSharing();
    }, [screen]);

    const handleAnalyze = useCallback(async () => {
        if (!voice.transcript.trim() && !voice.audioBlob) {
            const message = locale === 'ar' ? 'يرجى كتابة الفكرة أو تسجيلها صوتياً قبل الإرسال.' : 'Write the idea or record it by voice before sending.';
            setSubmitError(message);
            return;
        }

        // Best-effort frame capture: capture if sharing, keep last captured frame, or proceed without.
        let frameToSend = capturedFrame;
        if (screen.isSharing) {
            try {
                frameToSend = await screen.captureFrame();
                setCapturedFrame(frameToSend);
            } catch (error) {
                const message = error instanceof Error ? error.message : (locale === 'ar' ? 'تعذر التقاط الإطار الحالي.' : 'Unable to capture the current frame.');
                appendEvent(locale === 'ar' ? 'تعذر التقاط الإطار' : 'Frame capture failed', message, 'warning');
                // Continue without a frame — text-only analysis will run
                frameToSend = null;
            }
        }

        setSubmitError(null);

        appendEvent(
            locale === 'ar' ? 'تم تجهيز النص' : 'Transcript prepared',
            voice.transcript.trim()
                ? (locale === 'ar'
                    ? (frameToSend ? 'سيتم إرسال النص والإطار للتحليل.' : 'سيتم إرسال النص للتحليل (بدون إطار مرئي).')
                    : (frameToSend ? 'Text and screen frame will be sent for analysis.' : 'Text will be sent for analysis (no visual context).'))
                : (locale === 'ar' ? 'سيتم إرسال التسجيل الصوتي وتحويله إلى نص على الخادم.' : 'The voice recording will be uploaded and transcribed on the server.'),
            'accent'
        );

        const clientRequestId = crypto.randomUUID();
        const userMessage: ThreadMessage = {
            id: `user-${clientRequestId}`,
            role: 'user',
            content: voice.transcript.trim() || (locale === 'ar' ? 'تم إرسال رسالة صوتية للتحويل والتحليل.' : 'A voice note was sent for transcription and analysis.'),
            mode,
        };

        setMessages((previous) => [...previous, userMessage]);

        const formData = new FormData();
        if (frameToSend) {
            formData.append('frame', frameToSend, 'frame.jpg');
        }
        formData.append('mode', mode);
        formData.append('language', voice.language === 'ar-SA' ? 'ar' : 'en');
        formData.append('client_request_id', clientRequestId);

        if (voice.transcript.trim()) {
            formData.append('transcript', voice.transcript.trim());
        }

        if (voice.audioBlob) {
            formData.append('audio', voice.audioBlob, 'audio.webm');
        }

        if (sessionId) {
            formData.append('session_id', String(sessionId));
        }

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch('/assistant/analyze', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || (locale === 'ar' ? `فشل الطلب: ${response.status}` : `Request failed: ${response.status}`));
            }

            const data = await response.json();
            setSessionId(data.session_id);
            setCurrentRequestMessageId(data.message_id);
            setCurrentRequestMode(mode);
            stream.subscribe(data.message_id);
            voice.setTranscript('');
            voice.setAudioBlob(null);
            appendEvent(
                locale === 'ar' ? 'تم إرسال الطلب إلى الخادم' : 'Request sent to server',
                locale === 'ar' ? 'بدأت دورة التحليل الجديدة للجلسة الحالية.' : 'A new analysis cycle has started for the current session.',
                'success'
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : (locale === 'ar' ? 'حدث خطأ غير متوقع أثناء الإرسال.' : 'An unexpected error happened while sending the request.');
            setSubmitError(message);
            appendEvent(locale === 'ar' ? 'فشل إرسال الطلب' : 'Request failed', message, 'danger');
        }
    }, [capturedFrame, screen, voice, mode, sessionId, appendEvent, stream, locale]);

    const handleCancel = useCallback(async () => {
        if (!currentRequestMessageId) {
            stream.reset();
            return;
        }

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            await fetch(`/assistant/messages/${currentRequestMessageId}/cancel`, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
            });
            appendEvent(
                locale === 'ar' ? 'تم طلب الإلغاء' : 'Cancellation requested',
                locale === 'ar'
                    ? 'تم إرسال إشارة إلغاء تعاونية إلى دورة التحليل الحالية.'
                    : 'A cooperative cancellation signal was sent to the current analysis cycle.',
                'warning'
            );
        } finally {
            stream.reset();
            setCurrentRequestMessageId(null);
        }
    }, [currentRequestMessageId, stream, appendEvent, locale]);

    const handleRestartSession = useCallback(() => {
        stream.reset();
        setMessages([]);
        setSessionId(null);
        setCurrentRequestMessageId(null);
        setCurrentRequestMode('idea_check');
        setCapturedFrame(null);
        setSubmitError(null);
        voice.setTranscript('');
        voice.setAudioBlob(null);
        setMode('idea_check');
        setEvents([]);
        previousAudioUrlRef.current = null;
        previousErrorRef.current = null;
        previousStatusRef.current = 'idle';
        appendEvent(
            locale === 'ar' ? 'بدأت مساحة جديدة' : 'Started a fresh workspace',
            locale === 'ar'
                ? 'تم تصفير المحادثة الحالية مع الحفاظ على إمكانية مشاركة الشاشة.'
                : 'The current conversation was reset while keeping screen sharing available.',
            'neutral'
        );
    }, [appendEvent, stream, voice, locale]);

    const handleReconnect = useCallback(() => {
        if (currentRequestMessageId) {
            stream.subscribe(currentRequestMessageId);
            appendEvent(
                locale === 'ar' ? 'إعادة ربط المتابعة' : 'Reconnect attempted',
                locale === 'ar'
                    ? 'تمت محاولة إعادة الاشتراك بقناة المتابعة الحالية.'
                    : 'The current follow-up channel was resubscribed.',
                'accent'
            );
        }
    }, [currentRequestMessageId, stream, appendEvent, locale]);

    const handleExpandPreview = useCallback(() => {
        if (!capturedFrame) {
            setSubmitError(locale === 'ar' ? 'لا يوجد إطار محفوظ لفتحه.' : 'There is no saved frame to open.');
            return;
        }

        if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
            setSubmitError(locale === 'ar' ? 'المعاينة الموسعة غير مدعومة في هذا المتصفح.' : 'Expanded preview is not supported in this browser.');
            return;
        }

        const previewUrl = URL.createObjectURL(capturedFrame);
        window.open(previewUrl, '_blank', 'noopener,noreferrer');
        window.setTimeout(() => {
            if (typeof URL.revokeObjectURL === 'function') {
                URL.revokeObjectURL(previewUrl);
            }
        }, 60_000);
    }, [capturedFrame, locale]);

    const contextPanel = useMemo(() => (
        <ScreenContextPanel
            isSharing={screen.isSharing}
            stream={screen.stream}
            capturedFrame={capturedFrame}
            previewSrc={null}
            transcript={voice.transcript}
            language={voice.language}
            selectedMode={mode}
            status={status}
            sessionId={sessionId}
            currentRequestMessageId={currentRequestMessageId}
            isUsingPolling={stream.isUsingPolling}
            audioUrl={stream.audioUrl}
            error={submitError || screen.error || voice.error}
            events={events}
            onStartSharing={handleStartSharing}
            onRefreshCapture={refreshCapture}
            onRestartSession={handleRestartSession}
            onReconnect={handleReconnect}
            onExpandPreview={handleExpandPreview}
        />
    ), [
        screen.isSharing,
        screen.stream,
        screen.error,
        capturedFrame,
        voice.transcript,
        voice.language,
        voice.error,
        mode,
        status,
        sessionId,
        currentRequestMessageId,
        stream.isUsingPolling,
        stream.audioUrl,
        submitError,
        events,
        handleStartSharing,
        refreshCapture,
        handleRestartSession,
        handleReconnect,
        handleExpandPreview,
    ]);

    return (
        <AssistantWorkspace
            mode={mode}
            onModeChange={setMode}
            status={status}
            sessionId={sessionId}
            currentRequestMessageId={currentRequestMessageId}
            messages={messages}
            currentPartialText={stream.partialText}
            transcript={voice.transcript}
            language={voice.language}
            isRecording={voice.isRecording}
            isBusy={isBusy}
            canSubmit={canSubmit}
            hasCapturedFrame={Boolean(capturedFrame)}
            hasAudioBlob={Boolean(voice.audioBlob)}
            isFallbackMode={voice.isFallbackMode}
            submitError={submitError || screen.error || voice.error}
            isUsingPolling={stream.isUsingPolling}
            contextPanel={contextPanel}
            recentEvents={events}
            onTranscriptChange={voice.setTranscript}
            onLanguageChange={voice.setLanguage}
            onStartSharing={handleStartSharing}
            onRefreshCapture={refreshCapture}
            onStartRecording={voice.startRecording}
            onStopRecording={voice.stopRecording}
            onSubmit={handleAnalyze}
            onCancel={handleCancel}
        />
    );
}

type AssistantVisualPageProps = {
    scenarioName: AssistantVisualScenarioName;
    modeOverride: AssistantMode | null;
};

function AssistantVisualPage({ scenarioName, modeOverride }: AssistantVisualPageProps) {
    const { locale } = useUiLocale();
    const [mode, setMode] = useState<AssistantMode>(modeOverride ?? 'idea_check');
    const scenario = useMemo(() => getAssistantVisualScenario(scenarioName, locale, mode), [locale, mode, scenarioName]);
    const isBusy = BUSY_STATUSES.includes(scenario.status);
    const canSubmit = Boolean((scenario.transcript.trim() || scenario.hasAudioBlob) && scenario.previewSrc);

    const contextPanel = (
        <ScreenContextPanel
            isSharing={scenario.isSharing}
            stream={null}
            capturedFrame={null}
            previewSrc={scenario.previewSrc}
            transcript={scenario.transcript}
            language={scenario.language}
            selectedMode={scenario.mode}
            status={scenario.status}
            sessionId={scenario.sessionId}
            currentRequestMessageId={scenario.currentRequestMessageId}
            isUsingPolling={scenario.isUsingPolling}
            audioUrl={scenario.audioUrl}
            error={scenario.error}
            events={scenario.events}
            onStartSharing={() => {}}
            onRefreshCapture={() => {}}
            onRestartSession={() => {}}
            onReconnect={() => {}}
            onExpandPreview={() => {}}
        />
    );

    return (
        <AssistantWorkspace
            mode={scenario.mode}
            onModeChange={setMode}
            status={scenario.status}
            sessionId={scenario.sessionId}
            currentRequestMessageId={scenario.currentRequestMessageId}
            messages={scenario.messages}
            currentPartialText={scenario.currentPartialText}
            transcript={scenario.transcript}
            language={scenario.language}
            isRecording={scenario.isRecording}
            isBusy={isBusy}
            canSubmit={canSubmit}
            hasCapturedFrame={Boolean(scenario.previewSrc)}
            hasAudioBlob={scenario.hasAudioBlob}
            isFallbackMode={scenario.isFallbackMode}
            submitError={scenario.error}
            isUsingPolling={scenario.isUsingPolling}
            contextPanel={contextPanel}
            recentEvents={scenario.events}
            onTranscriptChange={() => {}}
            onLanguageChange={() => {}}
            onStartSharing={() => {}}
            onRefreshCapture={() => {}}
            onStartRecording={() => {}}
            onStopRecording={() => {}}
            onSubmit={() => {}}
            onCancel={() => {}}
        />
    );
}
