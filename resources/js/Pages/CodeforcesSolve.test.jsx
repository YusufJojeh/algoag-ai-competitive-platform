import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CodeforcesSolve from './CodeforcesSolve';

const mockUsePage = vi.fn();
const mockUseForm = vi.fn();
const mockPost = vi.fn();
const mockLink = ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>;

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    useForm: (initial) => {
        const out = mockUseForm(initial);
        return out ?? {
            data: initial ?? { problem: '', language: 'cpp' },
            setData: vi.fn(),
            post: mockPost,
            processing: false,
            errors: {},
        };
    },
    Link: (props) => mockLink(props),
}));

describe('CodeforcesSolve', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUsePage.mockReturnValue({
            props: {
                ollamaAvailable: true,
                recentSolutions: [],
                flash: null,
            },
        });
        mockUseForm.mockImplementation((data = { problem: '', language: 'cpp' }) => ({
            data: { problem: data.problem ?? '', language: data.language ?? 'cpp' },
            setData: vi.fn(),
            post: mockPost,
            processing: false,
            errors: {},
        }));
    });

    it('renders header and form', () => {
        render(<CodeforcesSolve />);
        expect(screen.getByText(/تحليل المسألة وحلها من النص الملصق/)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/الصق هنا نص المسألة/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /حل المسألة/ })).toBeInTheDocument();
    });

    it('renders link to assistant workspace', () => {
        render(<CodeforcesSolve />);
        expect(screen.getByRole('link', { name: /انتقل إلى المساعد/ })).toHaveAttribute('href', '/assistant');
    });

    it('shows ollama warning when ollamaAvailable is false', () => {
        mockUsePage.mockReturnValue({
            props: { ollamaAvailable: false, recentSolutions: [], flash: null },
        });
        render(<CodeforcesSolve />);
        expect(screen.getByText(/Ollama غير متصل/)).toBeInTheDocument();
    });

    it('submit button is disabled when problem is empty', () => {
        render(<CodeforcesSolve />);
        expect(screen.getByRole('button', { name: /حل المسألة/ })).toBeDisabled();
    });

    it('submit button is disabled when ollama unavailable', () => {
        mockUsePage.mockReturnValue({
            props: { ollamaAvailable: false, recentSolutions: [], flash: null },
        });
        mockUseForm.mockImplementation(() => ({
            data: { problem: 'Enough problem text here.', language: 'cpp' },
            setData: vi.fn(),
            post: mockPost,
            processing: false,
            errors: {},
        }));
        render(<CodeforcesSolve />);
        expect(screen.getByRole('button', { name: /حل المسألة/ })).toBeDisabled();
    });

    it('calls post on form submit when problem has content', () => {
        mockUseForm.mockImplementation(() => ({
            data: { problem: 'Given n numbers find max.', language: 'cpp' },
            setData: vi.fn(),
            post: mockPost,
            processing: false,
            errors: {},
        }));
        render(<CodeforcesSolve />);
        fireEvent.submit(screen.getByRole('button', { name: /حل المسألة/ }).closest('form'));
        expect(mockPost).toHaveBeenCalledWith('/solve', expect.objectContaining({ preserveScroll: true }));
    });

    it('renders language select with C++ and Python', () => {
        render(<CodeforcesSolve />);
        const select = screen.getByRole('combobox', { name: /لغة الحل/ });
        expect(select).toBeInTheDocument();
        expect(select).toHaveValue('cpp');
        expect(screen.getByRole('option', { name: 'C++' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Python' })).toBeInTheDocument();
    });

    it('setData called when language changes', () => {
        const setData = vi.fn();
        mockUseForm.mockImplementation(() => ({
            data: { problem: '', language: 'cpp' },
            setData,
            post: mockPost,
            processing: false,
            errors: {},
        }));
        render(<CodeforcesSolve />);
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'python' } });
        expect(setData).toHaveBeenCalledWith('language', 'python');
    });

    it('shows validation error for problem', () => {
        mockUseForm.mockImplementation(() => ({
            data: { problem: 'short', language: 'cpp' },
            setData: vi.fn(),
            post: mockPost,
            processing: false,
            errors: { problem: 'المسألة يجب أن تكون 10 أحرف على الأقل.' },
        }));
        render(<CodeforcesSolve />);
        expect(screen.getByText(/المسألة يجب أن تكون 10 أحرف/)).toBeInTheDocument();
    });

    it('shows ollama error', () => {
        mockUseForm.mockImplementation(() => ({
            data: { problem: 'A long problem text.', language: 'cpp' },
            setData: vi.fn(),
            post: mockPost,
            processing: false,
            errors: { ollama: 'تعذر الاتصال بـ Ollama.' },
        }));
        render(<CodeforcesSolve />);
        expect(screen.getByText(/تعذر الاتصال بـ Ollama/)).toBeInTheDocument();
    });

    it('shows processing state on submit button', () => {
        mockUseForm.mockImplementation(() => ({
            data: { problem: 'Enough problem text here.', language: 'cpp' },
            setData: vi.fn(),
            post: mockPost,
            processing: true,
            errors: {},
        }));
        render(<CodeforcesSolve />);
        expect(screen.getByRole('button', { name: /جاري حل المسألة/ })).toBeInTheDocument();
    });

    it('renders recent solutions when provided', () => {
        mockUsePage.mockReturnValue({
            props: {
                ollamaAvailable: true,
                recentSolutions: [
                    { id: 1, problem_preview: 'Max problem', status: 'completed', created_at: 'منذ ساعة' },
                ],
                flash: null,
            },
        });
        render(<CodeforcesSolve />);
        expect(screen.getByText('آخر الحلول')).toBeInTheDocument();
        expect(screen.getByText('Max problem')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Max problem/ })).toHaveAttribute('href', '/solve/result/1');
        expect(screen.getByText('مكتمل')).toBeInTheDocument();
    });

    it('renders failed status for recent solution', () => {
        mockUsePage.mockReturnValue({
            props: {
                ollamaAvailable: true,
                recentSolutions: [
                    { id: 2, problem_preview: 'Failed', status: 'failed', created_at: 'الآن' },
                ],
                flash: null,
            },
        });
        render(<CodeforcesSolve />);
        expect(screen.getByText('فشل')).toBeInTheDocument();
    });

    it('renders processing status for recent solution', () => {
        mockUsePage.mockReturnValue({
            props: {
                ollamaAvailable: true,
                recentSolutions: [
                    { id: 3, problem_preview: 'Running', status: 'processing', created_at: 'الآن' },
                ],
                flash: null,
            },
        });
        render(<CodeforcesSolve />);
        expect(screen.getByText('processing')).toBeInTheDocument();
    });

    it('shows flash message when present', () => {
        mockUsePage.mockReturnValue({
            props: { ollamaAvailable: true, recentSolutions: [], flash: { message: 'تم الحل.' } },
        });
        render(<CodeforcesSolve />);
        expect(screen.getByText('تم الحل.')).toBeInTheDocument();
    });

    it('does not render recent solutions section when empty', () => {
        mockUsePage.mockReturnValue({
            props: { ollamaAvailable: true, recentSolutions: [], flash: null },
        });
        render(<CodeforcesSolve />);
        expect(screen.queryByText('آخر الحلول')).not.toBeInTheDocument();
    });

    it('handles undefined recentSolutions gracefully', () => {
        mockUsePage.mockReturnValue({
            props: { ollamaAvailable: true, flash: null },
        });
        render(<CodeforcesSolve />);
        expect(screen.getByText(/تحليل المسألة وحلها من النص الملصق/)).toBeInTheDocument();
    });

    it('textarea onChange calls setData', () => {
        const setData = vi.fn();
        mockUseForm.mockImplementation(() => ({
            data: { problem: '', language: 'cpp' },
            setData,
            post: mockPost,
            processing: false,
            errors: {},
        }));
        render(<CodeforcesSolve />);
        fireEvent.change(screen.getByPlaceholderText(/الصق هنا/), { target: { value: 'new text' } });
        expect(setData).toHaveBeenCalledWith('problem', 'new text');
    });
});
