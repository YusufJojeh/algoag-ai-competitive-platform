import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';

import CodeforcesSolve from './CodeforcesSolve';
import { UiLocaleProvider } from '@/lib/ui-locale';

const mockUsePage = vi.fn();
const mockUseForm = vi.fn();
const mockPost = vi.fn();
const mockLink = ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>;

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    useForm: (initial) => {
        const out = mockUseForm(initial);
        return out ?? {
            data: initial ?? { problem: '', language: 'python', response_language: 'ar' },
            setData: vi.fn(),
            post: mockPost,
            processing: false,
            errors: {},
        };
    },
    Link: (props) => mockLink(props),
}));

function renderPage(locale = 'ar') {
    return render(
        <UiLocaleProvider locale={locale}>
            <CodeforcesSolve />
        </UiLocaleProvider>,
    );
}

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
        mockUseForm.mockImplementation((data = { problem: '', language: 'python', response_language: 'ar' }) => ({
            data: {
                problem: data.problem ?? '',
                language: data.language ?? 'python',
                response_language: data.response_language ?? 'ar',
            },
            setData: vi.fn(),
            post: mockPost,
            processing: false,
            errors: {},
        }));
    });

    it('renders readable Arabic header and form', () => {
        renderPage();
        expect(screen.getByText('تحليل المسألة وحلها من النص الملصق')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/الصق هنا نص المسألة كاملا/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'حل المسألة' })).toBeInTheDocument();
    });

    it('renders English header when locale is English', () => {
        renderPage('en');
        expect(screen.getByText('Analyze and solve a pasted problem statement')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Paste the full statement here/)).toBeInTheDocument();
    });

    it('renders link to assistant workspace', () => {
        renderPage();
        expect(screen.getByRole('link', { name: 'انتقل إلى المساعد' })).toHaveAttribute('href', '/assistant');
    });

    it('shows provider warning when AI provider is unavailable', () => {
        mockUsePage.mockReturnValue({
            props: { ollamaAvailable: false, recentSolutions: [], flash: null },
        });
        renderPage();
        expect(screen.getByText(/مزود الذكاء الاصطناعي غير متصل/)).toBeInTheDocument();
    });

    it('submit button is disabled when problem is empty or provider unavailable', () => {
        renderPage();
        expect(screen.getByRole('button', { name: 'حل المسألة' })).toBeDisabled();

        cleanup();
        mockUsePage.mockReturnValue({
            props: { ollamaAvailable: false, recentSolutions: [], flash: null },
        });
        mockUseForm.mockImplementation(() => ({
            data: { problem: 'Enough problem text here.', language: 'cpp', response_language: 'ar' },
            setData: vi.fn(),
            post: mockPost,
            processing: false,
            errors: {},
        }));
        renderPage();
        expect(screen.getByRole('button', { name: 'حل المسألة' })).toBeDisabled();
    });

    it('calls post on form submit when problem has content', () => {
        mockUseForm.mockImplementation(() => ({
            data: { problem: 'Given n numbers find max.', language: 'cpp', response_language: 'ar' },
            setData: vi.fn(),
            post: mockPost,
            processing: false,
            errors: {},
        }));
        renderPage();
        fireEvent.submit(screen.getByRole('button', { name: 'حل المسألة' }).closest('form'));
        expect(mockPost).toHaveBeenCalledWith('/solve', expect.objectContaining({ preserveScroll: true }));
    });

    it('renders language select with C++ and Python', () => {
        renderPage();
        const select = screen.getByRole('combobox', { name: /لغة الحل/ });
        expect(select).toBeInTheDocument();
        expect(select).toHaveValue('python');
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(2);
        expect(options.map((option) => option.value)).toEqual(['python', 'cpp']);
        expect(screen.getByRole('option', { name: 'Python' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'C++' })).toBeInTheDocument();
    });

    it('updates problem and language fields', () => {
        const setData = vi.fn();
        mockUseForm.mockImplementation(() => ({
            data: { problem: '', language: 'cpp', response_language: 'ar' },
            setData,
            post: mockPost,
            processing: false,
            errors: {},
        }));
        renderPage();
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'python' } });
        fireEvent.change(screen.getByPlaceholderText(/الصق هنا/), { target: { value: 'new text' } });
        expect(setData).toHaveBeenCalledWith('language', 'python');
        expect(setData).toHaveBeenCalledWith('problem', 'new text');
    });

    it('shows validation and queue errors', () => {
        mockUseForm.mockImplementation(() => ({
            data: { problem: 'short', language: 'cpp', response_language: 'ar' },
            setData: vi.fn(),
            post: mockPost,
            processing: false,
            errors: { problem: 'المسألة قصيرة.', queue: 'AI processing is not configured.' },
        }));
        renderPage();
        expect(screen.getByText('المسألة قصيرة.')).toBeInTheDocument();
        expect(screen.getByText('AI processing is not configured.')).toBeInTheDocument();
    });

    it('shows processing state on submit button', () => {
        mockUseForm.mockImplementation(() => ({
            data: { problem: 'Enough problem text here.', language: 'cpp', response_language: 'ar' },
            setData: vi.fn(),
            post: mockPost,
            processing: true,
            errors: {},
        }));
        renderPage();
        expect(screen.getByRole('button', { name: /جاري حل المسألة/ })).toBeInTheDocument();
    });

    it('renders recent solutions with localized title, preview, and status', () => {
        mockUsePage.mockReturnValue({
            props: {
                ollamaAvailable: true,
                recentSolutions: [
                    { id: 1, problem_title: 'أكبر قيمة', problem_preview: 'أوجد أكبر قيمة', status: 'completed', created_at: 'منذ ساعة' },
                    { id: 2, problem_preview: 'Running', status: 'processing', created_at: 'الآن' },
                ],
                flash: null,
            },
        });
        renderPage();
        expect(screen.getByText('آخر الحلول')).toBeInTheDocument();
        expect(screen.getByText('أكبر قيمة')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /أكبر قيمة/ })).toHaveAttribute('href', '/solve/result/1');
        expect(screen.getByText('مكتمل')).toBeInTheDocument();
        expect(screen.getByText('قيد المعالجة')).toBeInTheDocument();
    });

    it('shows flash message and hides empty recent section', () => {
        mockUsePage.mockReturnValue({
            props: { ollamaAvailable: true, recentSolutions: [], flash: { message: 'تم إرسال المسألة.' } },
        });
        renderPage();
        expect(screen.getByText('تم إرسال المسألة.')).toBeInTheDocument();
        expect(screen.queryByText('آخر الحلول')).not.toBeInTheDocument();
    });
});
