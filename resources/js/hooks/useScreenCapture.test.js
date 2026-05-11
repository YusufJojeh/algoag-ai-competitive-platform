import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useScreenCapture from './useScreenCapture';

function createMockStream(active = true) {
    const track = {
        stop: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    };
    return {
        active,
        getTracks: () => [track],
        getVideoTracks: () => [track],
        _track: track,
    };
}

describe('useScreenCapture', () => {
    let originalMediaDevices;

    beforeEach(() => {
        originalMediaDevices = navigator.mediaDevices;
    });

    afterEach(() => {
        Object.defineProperty(navigator, 'mediaDevices', {
            value: originalMediaDevices,
            writable: true,
            configurable: true,
        });
    });

    it('reports unsupported when getDisplayMedia is missing', () => {
        Object.defineProperty(navigator, 'mediaDevices', {
            value: {},
            writable: true,
            configurable: true,
        });

        const { result } = renderHook(() => useScreenCapture());
        expect(result.current.isSupported).toBe(false);
        expect(result.current.isSharing).toBe(false);
    });

    it('starts sharing when getDisplayMedia succeeds', async () => {
        const mockStream = createMockStream();
        Object.defineProperty(navigator, 'mediaDevices', {
            value: {
                getDisplayMedia: vi.fn().mockResolvedValue(mockStream),
            },
            writable: true,
            configurable: true,
        });

        const { result } = renderHook(() => useScreenCapture());
        expect(result.current.isSupported).toBe(true);

        await act(async () => {
            await result.current.startSharing();
        });

        expect(result.current.isSharing).toBe(true);
        expect(result.current.error).toBeNull();
    });

    it('sets error on permission denied', async () => {
        const err = new DOMException('denied', 'NotAllowedError');
        Object.defineProperty(navigator, 'mediaDevices', {
            value: {
                getDisplayMedia: vi.fn().mockRejectedValue(err),
            },
            writable: true,
            configurable: true,
        });

        const { result } = renderHook(() => useScreenCapture());

        await act(async () => {
            await result.current.startSharing();
        });

        expect(result.current.isSharing).toBe(false);
        expect(result.current.error).toContain('رفض');
    });

    it('stops sharing and cleans up tracks', async () => {
        const mockStream = createMockStream();
        Object.defineProperty(navigator, 'mediaDevices', {
            value: {
                getDisplayMedia: vi.fn().mockResolvedValue(mockStream),
            },
            writable: true,
            configurable: true,
        });

        const { result } = renderHook(() => useScreenCapture());

        await act(async () => {
            await result.current.startSharing();
        });
        expect(result.current.isSharing).toBe(true);

        act(() => {
            result.current.stopSharing();
        });

        expect(result.current.isSharing).toBe(false);
        expect(mockStream._track.stop).toHaveBeenCalled();
    });

    it('sets error when unsupported browser tries to start', async () => {
        Object.defineProperty(navigator, 'mediaDevices', {
            value: {},
            writable: true,
            configurable: true,
        });

        const { result } = renderHook(() => useScreenCapture());

        await act(async () => {
            await result.current.startSharing();
        });

        expect(result.current.error).toBeTruthy();
        expect(result.current.isSharing).toBe(false);
    });

    it('captureFrame rejects when not sharing', async () => {
        Object.defineProperty(navigator, 'mediaDevices', {
            value: { getDisplayMedia: vi.fn() },
            writable: true,
            configurable: true,
        });

        const { result } = renderHook(() => useScreenCapture());

        await expect(result.current.captureFrame()).rejects.toThrow();
    });
});
