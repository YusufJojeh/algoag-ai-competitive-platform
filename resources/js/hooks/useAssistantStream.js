import { useState, useRef, useCallback, useEffect } from 'react';

const POLL_INTERVAL = 3000;
const QUEUE_STALL_MS = 20000;
const TERMINAL_STATUSES = ['completed', 'failed', 'cancelled'];

export default function useAssistantStream(userId) {
    const [status, setStatus] = useState('idle');
    const [partialText, setPartialText] = useState('');
    const [fullText, setFullText] = useState('');
    const [audioUrl, setAudioUrl] = useState(null);
    const [transcribedText, setTranscribedText] = useState('');
    const [error, setError] = useState(null);
    const [isUsingPolling, setIsUsingPolling] = useState(false);

    const messageIdRef = useRef(null);
    const pollTimerRef = useRef(null);
    const echoChannelRef = useRef(null);
    const chunksRef = useRef([]);
    const queuedAtRef = useRef(null);

    const hasEcho = typeof window !== 'undefined' && window.Echo;

    const reset = useCallback(() => {
        if (echoChannelRef.current && hasEcho) {
            try {
                window.Echo.leave(`assistant.${userId}`);
            } catch {
                // Ignore cleanup errors
            }
            echoChannelRef.current = null;
        }
        setStatus('idle');
        setPartialText('');
        setFullText('');
        setAudioUrl(null);
        setTranscribedText('');
        setError(null);
        setIsUsingPolling(false);
        chunksRef.current = [];
        messageIdRef.current = null;
        queuedAtRef.current = null;
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    }, [hasEcho, userId]);

    const handleStatusUpdate = useCallback((data) => {
        if (messageIdRef.current && data.message_id !== messageIdRef.current) return;

        setStatus(data.status);

        if (data.status === 'failed') {
            setError(data.error || 'حدث خطأ أثناء التحليل');
        }
    }, []);

    const handleChunk = useCallback((data) => {
        if (messageIdRef.current && data.message_id !== messageIdRef.current) return;

        chunksRef.current[data.chunk_index] = data.chunk;
        setPartialText(chunksRef.current.filter(Boolean).join(''));
        setStatus('analyzing');
    }, []);

    const handleCompleted = useCallback((data) => {
        if (messageIdRef.current && data.message_id !== messageIdRef.current) return;

        setFullText(data.full_text);
        setPartialText('');
        setStatus('completed');
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    }, []);

    const handleTranscriptionCompleted = useCallback((data) => {
        if (messageIdRef.current && data.message_id !== messageIdRef.current) return;
        setTranscribedText(data.transcript ?? '');
    }, []);

    const handleTTSReady = useCallback((data) => {
        if (messageIdRef.current && data.message_id !== messageIdRef.current) return;
        setAudioUrl(data.audio_url);
    }, []);

    const startPolling = useCallback((msgId) => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        setIsUsingPolling(true);

        const poll = async () => {
            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
                const res = await fetch(`/assistant/messages/${msgId}/status`, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                    },
                });
                if (!res.ok) return;

                const data = await res.json();
                setStatus(data.status);
                if (data.status === 'queued' && queuedAtRef.current && Date.now() - queuedAtRef.current > QUEUE_STALL_MS) {
                    setError('The request is still waiting for a queue worker. If this keeps happening, check that php artisan queue:work is running.');
                }

                if (data.partial_text) setPartialText(data.partial_text);
                if (data.full_text) {
                    setFullText(data.full_text);
                    setPartialText('');
                }
                if (data.audio_ready && data.audio_url) {
                    setAudioUrl(data.audio_url);
                }
                if (data.error) setError(data.error);

                if (TERMINAL_STATUSES.includes(data.status)) {
                    clearInterval(pollTimerRef.current);
                    pollTimerRef.current = null;
                }
            } catch {
                // Silently retry on network errors
            }
        };

        pollTimerRef.current = setInterval(poll, POLL_INTERVAL);
        poll();
    }, []);

    const subscribe = useCallback((messageId) => {
        if (echoChannelRef.current && hasEcho) {
            try {
                window.Echo.leave(`assistant.${userId}`);
            } catch {
                // Ignore cleanup errors
            }
            echoChannelRef.current = null;
        }
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
        messageIdRef.current = messageId;
        chunksRef.current = [];
        setPartialText('');
        setFullText('');
        setAudioUrl(null);
        setTranscribedText('');
        setError(null);
        setStatus('queued');
        queuedAtRef.current = Date.now();

        if (hasEcho && userId) {
            try {
                const channel = window.Echo.private(`assistant.${userId}`);
                echoChannelRef.current = channel;

                channel
                    .listen('.analysis.started', handleStatusUpdate)
                    .listen('.analysis.chunk', handleChunk)
                    .listen('.analysis.completed', handleCompleted)
                    .listen('.analysis.failed', handleStatusUpdate)
                    .listen('.tts.ready', handleTTSReady)
                    .listen('.transcription.completed', handleTranscriptionCompleted);

                setIsUsingPolling(false);
                return;
            } catch {
                // Fall through to polling
            }
        }

        startPolling(messageId);
    }, [hasEcho, userId, handleStatusUpdate, handleChunk, handleCompleted, handleTTSReady, handleTranscriptionCompleted, startPolling]);

    const unsubscribe = useCallback(() => {
        if (echoChannelRef.current && hasEcho) {
            try {
                window.Echo.leave(`assistant.${userId}`);
            } catch {
                // Ignore cleanup errors
            }
            echoChannelRef.current = null;
        }
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    }, [hasEcho, userId]);

    useEffect(() => {
        return () => {
            unsubscribe();
        };
    }, [unsubscribe]);

    return {
        status,
        partialText,
        fullText,
        audioUrl,
        transcribedText,
        error,
        isUsingPolling,
        subscribe,
        unsubscribe,
        reset,
    };
}
