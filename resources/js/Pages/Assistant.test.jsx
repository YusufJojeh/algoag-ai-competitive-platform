import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Assistant from './Assistant';

const mockUsePage = vi.fn();

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
        isSharing: false,
        stream: null,
        error: null,
        isSupported: true,
        startSharing: vi.fn(),
        stopSharing: vi.fn(),
        captureFrame: vi.fn(),
        videoRef: { current: null },
    }),
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
        mockUsePage.mockReturnValue({
            props: {
                auth: { user: { id: 1, name: 'Test', email: 't@t.com', is_admin: false } },
            },
        });
    });

    it('renders the page heading', () => {
        render(<Assistant />);
        expect(screen.getByText('مساحة المساعد الصوتي والبصري')).toBeInTheDocument();
    });

    it('renders screen sharing empty state', () => {
        render(<Assistant />);
        expect(screen.getByText('ابدأ مشاركة الشاشة')).toBeInTheDocument();
    });

    it('renders transcript composer', () => {
        render(<Assistant />);
        expect(screen.getByPlaceholderText(/اشرح فكرتك الحالية/)).toBeInTheDocument();
    });

    it('renders all quick action modes', () => {
        render(<Assistant />);
        expect(screen.getByText('الموضوع')).toBeInTheDocument();
        expect(screen.getByText('ترشيح')).toBeInTheDocument();
        expect(screen.getByText('تلميح')).toBeInTheDocument();
        expect(screen.getAllByText('تحقق').length).toBeGreaterThan(0);
        expect(screen.getByText('منطق خاطئ')).toBeInTheDocument();
        expect(screen.getByText('حل كامل')).toBeInTheDocument();
        expect(screen.getByText('خطوة بخطوة')).toBeInTheDocument();
        expect(screen.getByText('مقارنة')).toBeInTheDocument();
        expect(screen.getByText('أخطاء شائعة')).toBeInTheDocument();
        expect(screen.getByText('حالات حدية')).toBeInTheDocument();
        expect(screen.getByText('التعقيد')).toBeInTheDocument();
    });

    it('renders send button', () => {
        render(<Assistant />);
        expect(screen.getByRole('button', { name: 'أرسل للتحليل' })).toBeInTheDocument();
    });

    it('renders conversation empty state', () => {
        render(<Assistant />);
        expect(screen.getByText('ابدأ جلسة تحليل جديدة')).toBeInTheDocument();
    });

    it('renders live context panel', () => {
        render(<Assistant />);
        expect(screen.getByText('لوحة السياق الحي')).toBeInTheDocument();
    });

    it('renders status indicator as idle', () => {
        render(<Assistant />);
        expect(screen.getAllByText('جاهز').length).toBeGreaterThan(0);
    });

    it('renders navigation links', () => {
        render(<Assistant />);
        expect(screen.getByText('الموضوعات')).toBeInTheDocument();
        expect(screen.getByText('المسائل')).toBeInTheDocument();
        expect(screen.getByText('المسارات')).toBeInTheDocument();
        expect(screen.getByText('Codeforces')).toBeInTheDocument();
    });

    it('analyze button is disabled when no frame captured', () => {
        render(<Assistant />);
        const btn = screen.getByRole('button', { name: 'أرسل للتحليل' });
        expect(btn).toBeDisabled();
    });
});
