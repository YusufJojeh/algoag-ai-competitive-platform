import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Home from './Home';

const mockUsePage = vi.fn();
const mockUseForm = vi.fn();
const mockPost = vi.fn();
const mockLink = ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>;

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    useForm: (initial) => {
        const out = mockUseForm(initial);
        return out ?? {
            data: initial ?? {},
            setData: vi.fn(),
            post: mockPost,
            processing: false,
            errors: {},
        };
    },
    Link: (props) => mockLink(props),
}));

describe('Home', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUsePage.mockReturnValue({
            props: {
                ollamaAvailable: true,
                recentSessions: [],
                flash: null,
            },
        });
        mockUseForm.mockImplementation((data = { problem: '' }) => ({
            data: { problem: data.problem ?? '' },
            setData: vi.fn((key, value) => {}),
            post: mockPost,
            processing: false,
            errors: {},
        }));
    });

    it('renders header and form', () => {
        render(<Home />);
        expect(screen.getByText(/مساعد تصميم الخوارزميات/)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/مصفوفة مرتبة/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /اقترح خوارزميات/ })).toBeInTheDocument();
    });

    it('shows ollama warning when ollamaAvailable is false', () => {
        mockUsePage.mockReturnValue({
            props: { ollamaAvailable: false, recentSessions: [], flash: null },
        });
        render(<Home />);
        expect(screen.getByText(/Ollama غير متصل/)).toBeInTheDocument();
    });

    it('shows flash message when present', () => {
        mockUsePage.mockReturnValue({
            props: { ollamaAvailable: true, recentSessions: [], flash: { message: 'تم الحفظ.' } },
        });
        render(<Home />);
        expect(screen.getByText('تم الحفظ.')).toBeInTheDocument();
    });

    it('submit button is disabled when problem is empty', () => {
        render(<Home />);
        const btn = screen.getByRole('button', { name: /اقترح خوارزميات/ });
        expect(btn).toBeDisabled();
    });

    it('calls post on form submit when problem has content', () => {
        mockUseForm.mockImplementation(() => ({
            data: { problem: 'Find element in sorted array.' },
            setData: vi.fn(),
            post: mockPost,
            processing: false,
            errors: {},
        }));
        render(<Home />);
        const btn = screen.getByRole('button', { name: /اقترح خوارزميات/ });
        fireEvent.click(btn);
        expect(mockPost).toHaveBeenCalledWith('/suggest', expect.any(Object));
    });

    it('renders recent sessions when provided', () => {
        mockUsePage.mockReturnValue({
            props: {
                ollamaAvailable: true,
                recentSessions: [
                    { id: 1, problem_preview: 'Sort array', recommendation_preview: 'Use quicksort', created_at: 'منذ ساعة' },
                ],
                flash: null,
            },
        });
        render(<Home />);
        expect(screen.getByText('آخر الجلسات')).toBeInTheDocument();
        expect(screen.getByText('Sort array')).toBeInTheDocument();
        const link = screen.getByRole('link', { name: /Sort array/ });
        expect(link).toHaveAttribute('href', '/session/1');
    });

    it('shows validation error for problem', () => {
        mockUseForm.mockImplementation(() => ({
            data: { problem: 'x' },
            setData: vi.fn(),
            post: mockPost,
            processing: false,
            errors: { problem: 'المسألة يجب أن تكون 10 أحرف على الأقل.' },
        }));
        render(<Home />);
        expect(screen.getByText(/المسألة يجب أن تكون 10 أحرف على الأقل/)).toBeInTheDocument();
    });

    it('shows ollama error', () => {
        mockUseForm.mockImplementation(() => ({
            data: { problem: 'A long enough problem description here.' },
            setData: vi.fn(),
            post: mockPost,
            processing: false,
            errors: { ollama: 'تعذر الاتصال بـ Ollama.' },
        }));
        render(<Home />);
        expect(screen.getByText(/تعذر الاتصال بـ Ollama/)).toBeInTheDocument();
    });

    it('shows processing state on submit button', () => {
        mockUseForm.mockImplementation(() => ({
            data: { problem: 'A long enough problem description here.' },
            setData: vi.fn(),
            post: mockPost,
            processing: true,
            errors: {},
        }));
        render(<Home />);
        expect(screen.getByRole('button', { name: /جاري التحليل/ })).toBeInTheDocument();
    });

    it('does not render recent sessions section when recentSessions is empty array', () => {
        mockUsePage.mockReturnValue({
            props: { ollamaAvailable: true, recentSessions: [], flash: null },
        });
        render(<Home />);
        expect(screen.queryByText('آخر الجلسات')).not.toBeInTheDocument();
    });

    it('handles undefined recentSessions gracefully', () => {
        mockUsePage.mockReturnValue({
            props: { ollamaAvailable: true, flash: null },
        });
        render(<Home />);
        expect(screen.getByText(/مساعد تصميم الخوارزميات/)).toBeInTheDocument();
    });

    it('textarea has correct placeholder', () => {
        render(<Home />);
        expect(screen.getByPlaceholderText(/لدي مصفوفة مرتبة/)).toBeInTheDocument();
    });

    it('form has submit type button', () => {
        render(<Home />);
        const btn = screen.getByRole('button', { name: /اقترح خوارزميات/ });
        expect(btn).toHaveAttribute('type', 'submit');
    });

    it('subtitle text is present', () => {
        render(<Home />);
        expect(screen.getByText(/افهم المسألة/)).toBeInTheDocument();
    });

    it('recent session without recommendation_preview still renders', () => {
        mockUsePage.mockReturnValue({
            props: {
                ollamaAvailable: true,
                recentSessions: [
                    { id: 2, problem_preview: 'Only problem', recommendation_preview: null, created_at: 'الآن' },
                ],
                flash: null,
            },
        });
        render(<Home />);
        expect(screen.getByText('Only problem')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Only problem/ })).toHaveAttribute('href', '/session/2');
    });

    it('textarea onChange calls setData', () => {
        const setData = vi.fn();
        mockUseForm.mockImplementation(() => ({
            data: { problem: '' },
            setData,
            post: mockPost,
            processing: false,
            errors: {},
        }));
        render(<Home />);
        const textarea = screen.getByPlaceholderText(/مصفوفة مرتبة/);
        fireEvent.change(textarea, { target: { value: 'new problem text' } });
        expect(setData).toHaveBeenCalledWith('problem', 'new problem text');
    });

    it('form onSubmit prevents default and calls post', () => {
        mockUseForm.mockImplementation(() => ({
            data: { problem: 'Enough text for validation.' },
            setData: vi.fn(),
            post: mockPost,
            processing: false,
            errors: {},
        }));
        render(<Home />);
        const form = screen.getByRole('button', { name: /اقترح خوارزميات/ }).closest('form');
        fireEvent.submit(form);
        expect(mockPost).toHaveBeenCalledWith('/suggest', expect.objectContaining({ preserveScroll: true }));
    });

    it('does not render flash div when flash is undefined', () => {
        mockUsePage.mockReturnValue({
            props: { ollamaAvailable: true, recentSessions: [] },
        });
        render(<Home />);
        expect(screen.queryByText('تم الحفظ.')).not.toBeInTheDocument();
    });
});
