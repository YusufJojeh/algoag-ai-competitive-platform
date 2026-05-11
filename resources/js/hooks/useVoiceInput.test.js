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
});
