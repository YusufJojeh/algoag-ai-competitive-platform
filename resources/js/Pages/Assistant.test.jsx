import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import Assistant from './Assistant';

const mockUsePage = vi.fn();
const mockScreenCaptureState = vi.hoisted(() => ({
    value: {
        isSharing: false,
        stream: null,
        error: null,
        isSupported: true,
        startSharing: vi.fn(),
        stopSharing: vi.fn(),
        captureFrame: vi.fn(),
        videoRef: { current: null },
    },
}));

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
    default: () => mockScreenCaptureState.value,
}));

vi.mock('../hooks/useVoiceInput', () => ({
    default: () => ({
        isRecording: false,
        transcript: '',
        audioBlob: null,
        setAudioBlob: vi.fn(),
        error: null,
        language: 'ar-SA',
        setLanguage: vi.fn(),
        setTranscript: vi.fn(),
        isSupported: true,
        isFallbackMode: false,
        startRecording: vi.fn(),
        stopRecording: vi.fn(),
    }),
}));

vi.mock('../hooks/useAssistantStream', () => ({
    default: () => ({
        status: 'idle',
        partialText: '',
        fullText: '',
        audioUrl: null,
        error: null,
        isUsingPolling: false,
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        reset: vi.fn(),
    }),
}));

describe('Assistant Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
        mockScreenCaptureState.value = {
            isSharing: false,
            stream: null,
            error: null,
            isSupported: true,
            startSharing: vi.fn(),
            stopSharing: vi.fn(),
            captureFrame: vi.fn(),
            videoRef: { current: null },
        };
        mockUsePage.mockReturnValue({
            props: {
                auth: { user: { id: 1, name: 'Test', email: 't@t.com', is_admin: false } },
            },
        });
    });

    it('renders the assistant workspace shell', () => {
        render(<Assistant />);
        expect(screen.getByTestId('assistant-workspace-shell')).toBeInTheDocument();
        expect(screen.getByTestId('screen-context-panel')).toBeInTheDocument();
        expect(screen.getByTestId('transcript-composer')).toBeInTheDocument();
    });

    it('renders one assistant mode dropdown with every supported mode', () => {
        render(<Assistant />);
        const modeSelect = screen.getByTestId('assistant-mode-select');
        const values = Array.from(modeSelect.options).map((option) => option.value);

        expect(modeSelect).toHaveAccessibleName('نمط المساعد');
        expect(modeSelect).toHaveValue('auto');
        expect(values).toEqual(expect.arrayContaining([
            'auto',
            'topic_explanation',
            'topic_recommendation',
            'hint',
            'idea_check',
            'logic_critique',
            'edge_cases',
            'complexity',
            'full_solution',
            'step_by_step_solution',
            'approach_compare',
            'common_mistakes',
            'solve',
            'generate_code',
            'generate_tests',
            'verify_code',
            'debug_wrong_answer',
            'wrong',
            'summarize',
            'next_step',
        ]));
    });

    it('does not render mode shortcut buttons', () => {
        render(<Assistant />);
        expect(screen.queryByRole('button', { name: /Give me a hint|Review the idea/i })).not.toBeInTheDocument();
    });

    it('renders the live navigation links', () => {
        render(<Assistant />);
        expect(screen.getByText('Codeforces')).toBeInTheDocument();
    });

    it('keeps submit disabled until there is frame, text, or audio input', () => {
        render(<Assistant />);
        expect(screen.getByRole('button', { name: 'أرسل للتحليل' })).toBeDisabled();
    });

    it('captures a screen frame immediately and every three seconds while sharing', async () => {
        vi.useFakeTimers();
        const captureFrame = vi.fn().mockResolvedValue(new Blob(['frame'], { type: 'image/jpeg' }));
        mockScreenCaptureState.value = {
            ...mockScreenCaptureState.value,
            isSharing: true,
            captureFrame,
        };

        const { unmount } = render(<Assistant />);

        await act(async () => {});
        expect(captureFrame).toHaveBeenCalledTimes(1);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(5_000);
        });

        expect(captureFrame).toHaveBeenCalledTimes(2);
        unmount();
        vi.useRealTimers();
    });
});
