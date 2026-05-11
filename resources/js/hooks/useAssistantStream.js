import { useState, useRef, useCallback, useEffect } from 'react';

const POLL_INTERVAL = 3000;
const TERMINAL_STATUSES = ['completed', 'failed', 'cancelled'];

export default function useAssistantStream(userId) {
    const [status, setStatus] = useState('idle');
    const [partialText, setPartialText] = useState('');
    const [fullText, setFullText] = useState('');
    const [audioUrl, setAudioUrl] = useState(null);
    const [error, setError] = useState(null);
    const [isUsingPolling, setIsUsingPolling] = useState(false);

    const messageIdRef = useRef(null);
    const pollTimerRef = useRef(null);
    const echoChannelRef = useRef(null);
    const chunksRef = useRef([]);

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
        setError(null);
        setIsUsingPolling(false);
        chunksRef.current = [];
        messageIdRef.current = null;
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
        setError(null);
        setStatus('queued');

        if (hasEcho && userId) {
            try {
                const channel = window.Echo.private(`assistant.${userId}`);
                echoChannelRef.current = channel;

                channel
                    .listen('.analysis.started', handleStatusUpdate)
                    .listen('.analysis.chunk', handleChunk)
                    .listen('.analysis.completed', handleCompleted)
                    .listen('.analysis.failed', handleStatusUpdate)
                    .listen('.tts.ready', handleTTSReady);

                setIsUsingPolling(false);
                return;
            } catch {
                // Fall through to polling
            }
        }

        startPolling(messageId);
    }, [hasEcho, userId, handleStatusUpdate, handleChunk, handleCompleted, handleTTSReady, startPolling]);

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
        error,
        isUsingPolling,
        subscribe,
        unsubscribe,
        reset,
    };
}
