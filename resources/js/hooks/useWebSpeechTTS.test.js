import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useWebSpeechTTS from './useWebSpeechTTS';

describe('useWebSpeechTTS', () => {
    const mockSpeak = vi.fn();
    const mockCancel = vi.fn();
    let lastUtterance = null;

    beforeEach(() => {
        vi.clearAllMocks();
        lastUtterance = null;

        vi.stubGlobal('SpeechSynthesisUtterance', class {
            constructor(text) {
                this.text = text;
                this.lang = '';
                this.rate = 1;
                this.onstart = null;
                this.onend = null;
                this.onerror = null;
                lastUtterance = this;
            }
        });
        vi.stubGlobal('speechSynthesis', { speak: mockSpeak, cancel: mockCancel });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('reports isSupported=true when speechSynthesis exists', () => {
        const { result } = renderHook(() => useWebSpeechTTS());
        expect(result.current.isSupported).toBe(true);
    });

    it('reports isSupported=false when speechSynthesis is undefined', () => {
        vi.stubGlobal('speechSynthesis', undefined);
        const { result } = renderHook(() => useWebSpeechTTS());
        expect(result.current.isSupported).toBe(false);
    });

    it('speak() cancels existing speech then queues new utterance', () => {
        const { result } = renderHook(() => useWebSpeechTTS());
        act(() => result.current.speak('hello', 'en'));
        expect(mockCancel).toHaveBeenCalled();
        expect(mockSpeak).toHaveBeenCalledTimes(1);
    });

    it('speak() sets utterance lang to ar-SA for Arabic', () => {
        const { result } = renderHook(() => useWebSpeechTTS());
        act(() => result.current.speak('مرحبا', 'ar'));
        expect(lastUtterance.lang).toBe('ar-SA');
    });

    it('speak() sets utterance lang to en-US for English', () => {
        const { result } = renderHook(() => useWebSpeechTTS());
        act(() => result.current.speak('hello', 'en'));
        expect(lastUtterance.lang).toBe('en-US');
    });

    it('speak() is a no-op for whitespace-only text', () => {
        const { result } = renderHook(() => useWebSpeechTTS());
        act(() => result.current.speak('   '));
        expect(mockSpeak).not.toHaveBeenCalled();
    });

    it('speak() is a no-op when not supported', () => {
        vi.stubGlobal('speechSynthesis', undefined);
        const { result } = renderHook(() => useWebSpeechTTS());
        act(() => result.current.speak('hello', 'en'));
        expect(mockSpeak).not.toHaveBeenCalled();
    });

    it('stop() cancels speech synthesis', () => {
        const { result } = renderHook(() => useWebSpeechTTS());
        act(() => result.current.stop());
        expect(mockCancel).toHaveBeenCalled();
    });

    it('stop() is a no-op when not supported', () => {
        vi.stubGlobal('speechSynthesis', undefined);
        const { result } = renderHook(() => useWebSpeechTTS());
        act(() => result.current.stop());
        expect(mockCancel).not.toHaveBeenCalled();
    });

    it('isSpeaking becomes true on onstart and false on onend', () => {
        const { result } = renderHook(() => useWebSpeechTTS());
        act(() => result.current.speak('hello', 'en'));
        act(() => lastUtterance.onstart());
        expect(result.current.isSpeaking).toBe(true);
        act(() => lastUtterance.onend());
        expect(result.current.isSpeaking).toBe(false);
    });

    it('isSpeaking becomes false on utterance error', () => {
        const { result } = renderHook(() => useWebSpeechTTS());
        act(() => result.current.speak('hello', 'en'));
        act(() => lastUtterance.onstart());
        act(() => lastUtterance.onerror());
        expect(result.current.isSpeaking).toBe(false);
    });

    it('cancels speech synthesis on unmount', () => {
        const { unmount } = renderHook(() => useWebSpeechTTS());
        unmount();
        expect(mockCancel).toHaveBeenCalled();
    });
});
