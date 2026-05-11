import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Assistant from './Assistant';

const mockUsePage = vi.fn();
const mockCaptureFrame = vi.fn();
const mockSetTranscript = vi.fn();
const mockSetAudioBlob = vi.fn();

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    useForm: (initial) => ({
        data: initial ?? {},
        setData: vi.fn(),
        post: vi.fn(),
        processing: false,
        errors: {},
    }),
    Link: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

vi.mock('../hooks/useScreenCapture', () => ({
    default: () => ({
        isSharing: true,
        stream: null,
        error: null,
        isSupported: true,
        startSharing: vi.fn(),
        stopSharing: vi.fn(),
        captureFrame: mockCaptureFrame,
        videoRef: { current: null },
    }),
}));

vi.mock('../hooks/useVoiceInput', () => ({
    default: () => ({
        isRecording: false,
        transcript: 'أعتقد أن الحل Binary Search',
        audioBlob: null,
        setAudioBlob: mockSetAudioBlob,
        error: null,
        language: 'ar-SA',
        setLanguage: vi.fn(),
        setTranscript: mockSetTranscript,
        isSupported: true,
        isFallbackMode: false,
        startRecording: vi.fn(),
        stopRecording: vi.fn(),
    }),
}));

describe('Assistant completion flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUsePage.mockReturnValue({
            props: {
                auth: { user: { id: 1, name: 'Test', email: 't@t.com', is_admin: false } },
            },
        });
        mockCaptureFrame.mockResolvedValue(new Blob(['frame'], { type: 'image/jpeg' }));
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    session_id: 1,
                    message_id: 42,
                    status: 'queued',
                    client_request_id: 'client-id',
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    status: 'completed',
                    partial_text: null,
                    full_text: 'فكرتك جيدة، لكن انتبه لحالة الحد الأخيرة.',
                    audio_ready: true,
                    audio_url: '/assistant/audio/77?signature=test',
                    error: null,
                }),
            }));
        vi.stubGlobal('crypto', { randomUUID: () => 'client-id' });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders assistant reply and audio after analyze completes via polling', async () => {
        render(<Assistant />);

        fireEvent.click(screen.getByRole('button', { name: 'أرسل للتحليل' }));

        await waitFor(() => {
            expect(screen.getByText('فكرتك جيدة، لكن انتبه لحالة الحد الأخيرة.')).toBeInTheDocument();
        });

        expect(screen.getByRole('button', { name: 'تشغيل' })).toBeInTheDocument();
        expect(mockSetTranscript).toHaveBeenCalledWith('');
        expect(mockSetAudioBlob).toHaveBeenCalledWith(null);
    });
});
