import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useAssistantStream from './useAssistantStream';

describe('useAssistantStream', () => {
    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        delete window.Echo;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('returns idle state by default', () => {
        const { result } = renderHook(() => useAssistantStream(1));
        expect(result.current.status).toBe('idle');
        expect(result.current.partialText).toBe('');
        expect(result.current.fullText).toBe('');
        expect(result.current.audioUrl).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('subscribe sets status to queued', async () => {
        const { result } = renderHook(() => useAssistantStream(1));

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ status: 'queued' }),
        });

        await act(async () => {
            result.current.subscribe(42);
            await Promise.resolve();
        });

        expect(result.current.status).toBe('queued');
    });

    it('falls back to polling when Echo is not available', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ status: 'analyzing' }),
        });

        const { result } = renderHook(() => useAssistantStream(1));

        await act(async () => {
            result.current.subscribe(42);
            await Promise.resolve();
        });

        expect(result.current.isUsingPolling).toBe(true);
    });

    it('reset clears all state', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ status: 'queued' }),
        });

        const { result } = renderHook(() => useAssistantStream(1));

        await act(async () => {
            result.current.subscribe(42);
            await Promise.resolve();
        });

        act(() => {
            result.current.reset();
        });

        expect(result.current.status).toBe('idle');
        expect(result.current.partialText).toBe('');
        expect(result.current.fullText).toBe('');
        expect(result.current.audioUrl).toBeNull();
    });

    it('uses Echo when available', () => {
        const listenMock = vi.fn().mockReturnThis();
        window.Echo = {
            private: vi.fn().mockReturnValue({ listen: listenMock }),
            leave: vi.fn(),
        };

        const { result } = renderHook(() => useAssistantStream(1));

        act(() => {
            result.current.subscribe(42);
        });

        expect(window.Echo.private).toHaveBeenCalledWith('assistant.1');
        expect(listenMock).toHaveBeenCalledWith('.analysis.started', expect.any(Function));
        expect(listenMock).toHaveBeenCalledWith('.analysis.chunk', expect.any(Function));
        expect(listenMock).toHaveBeenCalledWith('.analysis.completed', expect.any(Function));
        expect(listenMock).toHaveBeenCalledWith('.analysis.failed', expect.any(Function));
        expect(listenMock).toHaveBeenCalledWith('.tts.ready', expect.any(Function));
        expect(listenMock).toHaveBeenCalledWith('.transcription.completed', expect.any(Function));
        expect(result.current.isUsingPolling).toBe(false);
    });

    it('sets transcribedText when transcription.completed fires', () => {
        let transcriptionHandler;
        const listenMock = vi.fn().mockImplementation((event, handler) => {
            if (event === '.transcription.completed') transcriptionHandler = handler;
            return { listen: listenMock };
        });
        window.Echo = {
            private: vi.fn().mockReturnValue({ listen: listenMock }),
            leave: vi.fn(),
        };

        const { result } = renderHook(() => useAssistantStream(1));

        act(() => {
            result.current.subscribe(42);
        });

        expect(transcriptionHandler).toBeDefined();

        act(() => {
            transcriptionHandler({ message_id: 42, transcript: 'ما هو أسرع خوارزمية فرز؟', status: 'analyzing' });
        });

        expect(result.current.transcribedText).toBe('ما هو أسرع خوارزمية فرز؟');
    });

    it('resets transcribedText on reset()', async () => {
        let transcriptionHandler;
        const listenMock = vi.fn().mockImplementation((event, handler) => {
            if (event === '.transcription.completed') transcriptionHandler = handler;
            return { listen: listenMock };
        });
        window.Echo = {
            private: vi.fn().mockReturnValue({ listen: listenMock }),
            leave: vi.fn(),
        };

        const { result } = renderHook(() => useAssistantStream(1));

        act(() => { result.current.subscribe(42); });
        act(() => { transcriptionHandler({ message_id: 42, transcript: 'hello', status: 'analyzing' }); });
        expect(result.current.transcribedText).toBe('hello');

        act(() => { result.current.reset(); });
        expect(result.current.transcribedText).toBe('');
    });
});
