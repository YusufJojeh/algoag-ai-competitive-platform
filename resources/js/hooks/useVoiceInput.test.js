import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useVoiceInput from './useVoiceInput';

describe('useVoiceInput', () => {
    let originalSpeechRecognition;

    beforeEach(() => {
        originalSpeechRecognition = window.SpeechRecognition;
    });

    afterEach(() => {
        window.SpeechRecognition = originalSpeechRecognition;
        vi.restoreAllMocks();
    });

    it('returns default state', () => {
        const { result } = renderHook(() => useVoiceInput());
        expect(result.current.isRecording).toBe(false);
        expect(result.current.transcript).toBe('');
        expect(result.current.audioBlob).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.language).toBe('ar-SA');
    });

    it('allows setting transcript manually', () => {
        const { result } = renderHook(() => useVoiceInput());

        act(() => {
            result.current.setTranscript('فكرتي هي Binary Search');
        });

        expect(result.current.transcript).toBe('فكرتي هي Binary Search');
    });

    it('allows changing language', () => {
        const { result } = renderHook(() => useVoiceInput('ar-SA'));

        act(() => {
            result.current.setLanguage('en-US');
        });

        expect(result.current.language).toBe('en-US');
    });

    it('detects SpeechRecognition support when available', () => {
        window.SpeechRecognition = vi.fn().mockImplementation(() => ({
            start: vi.fn(), stop: vi.fn(), abort: vi.fn(),
            lang: '', interimResults: false, continuous: false, maxAlternatives: 1,
            onresult: null, onerror: null, onend: null,
        }));
        const { result } = renderHook(() => useVoiceInput());
        expect(result.current.isFallbackMode).toBe(false);
        delete window.SpeechRecognition;
    });

    it('detects fallback mode when SpeechRecognition missing', () => {
        delete window.SpeechRecognition;
        delete window.webkitSpeechRecognition;

        const { result } = renderHook(() => useVoiceInput());
        expect(result.current.isFallbackMode).toBe(true);
    });

    it('starts speech recognition when supported', () => {
        const mockStart = vi.fn();
        window.SpeechRecognition = vi.fn().mockImplementation(() => ({
            start: mockStart,
            stop: vi.fn(),
            abort: vi.fn(),
            lang: '',
            interimResults: false,
            continuous: false,
            maxAlternatives: 1,
            onresult: null,
            onerror: null,
            onend: null,
        }));

        const { result } = renderHook(() => useVoiceInput());

        act(() => {
            result.current.startRecording();
        });

        expect(mockStart).toHaveBeenCalled();
        expect(result.current.isRecording).toBe(true);
        delete window.SpeechRecognition;
    });

    it('stops recording', () => {
        const mockStop = vi.fn();
        window.SpeechRecognition = vi.fn().mockImplementation(() => ({
            start: vi.fn(),
            stop: mockStop,
            abort: vi.fn(),
            lang: '',
            interimResults: false,
            continuous: false,
            maxAlternatives: 1,
            onresult: null,
            onerror: null,
            onend: null,
        }));

        const { result } = renderHook(() => useVoiceInput());

        act(() => {
            result.current.startRecording();
        });

        act(() => {
            result.current.stopRecording();
        });

        expect(mockStop).toHaveBeenCalled();
        expect(result.current.isRecording).toBe(false);
        delete window.SpeechRecognition;
    });

    it('sets error when no audio support at all', () => {
        delete window.SpeechRecognition;
        delete window.webkitSpeechRecognition;

        const origMD = navigator.mediaDevices;
        Object.defineProperty(navigator, 'mediaDevices', {
            value: undefined,
            writable: true,
            configurable: true,
        });

        const { result } = renderHook(() => useVoiceInput());

        act(() => {
            result.current.startRecording();
        });

        expect(result.current.error).toBeTruthy();
        expect(result.current.isRecording).toBe(false);

        Object.defineProperty(navigator, 'mediaDevices', {
            value: origMD,
            writable: true,
            configurable: true,
        });
    });

    it('auto-stops and fires onSilenceAutoStop after 5s of silence following speech', () => {
        vi.useFakeTimers();
        const mockStop = vi.fn();
        let recognitionInstance;
        window.SpeechRecognition = vi.fn().mockImplementation(() => {
            recognitionInstance = {
                start: vi.fn(), stop: mockStop, abort: vi.fn(),
                lang: '', interimResults: false, continuous: false, maxAlternatives: 1,
                onresult: null, onerror: null, onend: null,
            };
            return recognitionInstance;
        });

        const onSilenceAutoStop = vi.fn();
        const { result } = renderHook(() => useVoiceInput('ar-SA', { onSilenceAutoStop }));

        act(() => {
            result.current.startRecording();
        });

        act(() => {
            recognitionInstance.onresult({
                results: [{ isFinal: true, 0: { transcript: 'فكرتي binary search' } }],
            });
        });

        // Not yet — 4 seconds in
        act(() => {
            vi.advanceTimersByTime(4_000);
        });
        expect(onSilenceAutoStop).not.toHaveBeenCalled();

        // 5 seconds of silence total → auto stop + callback
        act(() => {
            vi.advanceTimersByTime(1_000);
        });
        expect(mockStop).toHaveBeenCalled();
        expect(onSilenceAutoStop).toHaveBeenCalledTimes(1);
        expect(result.current.isRecording).toBe(false);

        vi.useRealTimers();
        delete window.SpeechRecognition;
    });

    it('restarts the silence countdown when new speech arrives', () => {
        vi.useFakeTimers();
        let recognitionInstance;
        window.SpeechRecognition = vi.fn().mockImplementation(() => {
            recognitionInstance = {
                start: vi.fn(), stop: vi.fn(), abort: vi.fn(),
                lang: '', interimResults: false, continuous: false, maxAlternatives: 1,
                onresult: null, onerror: null, onend: null,
            };
            return recognitionInstance;
        });

        const onSilenceAutoStop = vi.fn();
        const { result } = renderHook(() => useVoiceInput('ar-SA', { onSilenceAutoStop }));

        act(() => {
            result.current.startRecording();
        });

        act(() => {
            recognitionInstance.onresult({ results: [{ isFinal: false, 0: { transcript: 'أول' } }] });
        });
        act(() => {
            vi.advanceTimersByTime(4_000);
        });
        // More speech resets the timer
        act(() => {
            recognitionInstance.onresult({ results: [{ isFinal: false, 0: { transcript: 'أول جزء ثاني' } }] });
        });
        act(() => {
            vi.advanceTimersByTime(4_000);
        });
        expect(onSilenceAutoStop).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(1_000);
        });
        expect(onSilenceAutoStop).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
        delete window.SpeechRecognition;
    });

    it('does not start a silence countdown for empty speech results', () => {
        vi.useFakeTimers();
        let recognitionInstance;
        window.SpeechRecognition = vi.fn().mockImplementation(() => {
            recognitionInstance = {
                start: vi.fn(), stop: vi.fn(), abort: vi.fn(),
                lang: '', interimResults: false, continuous: false, maxAlternatives: 1,
                onresult: null, onerror: null, onend: null,
            };
            return recognitionInstance;
        });

        const onSilenceAutoStop = vi.fn();
        const { result } = renderHook(() => useVoiceInput('ar-SA', { onSilenceAutoStop }));

        act(() => {
            result.current.startRecording();
        });
        act(() => {
            recognitionInstance.onresult({ results: [{ isFinal: false, 0: { transcript: '   ' } }] });
        });
        act(() => {
            vi.advanceTimersByTime(10_000);
        });
        expect(onSilenceAutoStop).not.toHaveBeenCalled();
        expect(result.current.isRecording).toBe(true);

        vi.useRealTimers();
        delete window.SpeechRecognition;
    });

    it('manual stopRecording cancels the pending silence auto-send', () => {
        vi.useFakeTimers();
        let recognitionInstance;
        window.SpeechRecognition = vi.fn().mockImplementation(() => {
            recognitionInstance = {
                start: vi.fn(), stop: vi.fn(), abort: vi.fn(),
                lang: '', interimResults: false, continuous: false, maxAlternatives: 1,
                onresult: null, onerror: null, onend: null,
            };
            return recognitionInstance;
        });

        const onSilenceAutoStop = vi.fn();
        const { result } = renderHook(() => useVoiceInput('ar-SA', { onSilenceAutoStop }));

        act(() => {
            result.current.startRecording();
        });
        act(() => {
            recognitionInstance.onresult({ results: [{ isFinal: true, 0: { transcript: 'كلام' } }] });
        });
        act(() => {
            result.current.stopRecording();
        });
        act(() => {
            vi.advanceTimersByTime(10_000);
        });
        expect(onSilenceAutoStop).not.toHaveBeenCalled();

        vi.useRealTimers();
        delete window.SpeechRecognition;
    });

    it('uses MediaRecorder with detected mime type in fallback mode', async () => {
        delete window.SpeechRecognition;
        delete window.webkitSpeechRecognition;

        const mockStop = vi.fn();
        const mockStart = vi.fn();
        let dataHandler;
        let stopHandler;

        const mockRecorder = {
            start: mockStart,
            stop: mockStop,
            state: 'recording',
            mimeType: 'audio/webm',
            ondataavailable: null,
            onstop: null,
            onerror: null,
        };

        global.MediaRecorder = vi.fn().mockImplementation(() => mockRecorder);
        global.MediaRecorder.isTypeSupported = vi.fn().mockReturnValue(false);

        const mockStream = { getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]) };
        Object.defineProperty(navigator, 'mediaDevices', {
            value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
            writable: true,
            configurable: true,
        });

        const { result } = renderHook(() => useVoiceInput());

        await act(async () => {
            result.current.startRecording();
            await Promise.resolve();
        });

        // When no type is supported, MediaRecorder is called without a mimeType option
        expect(global.MediaRecorder).toHaveBeenCalledWith(mockStream);
        expect(mockStart).toHaveBeenCalled();
    });
});
