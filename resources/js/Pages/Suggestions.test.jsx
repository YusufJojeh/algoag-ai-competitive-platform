import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Suggestions from './Suggestions';

const mockUsePage = vi.fn();
const mockUseForm = vi.fn();
const mockPost = vi.fn();

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    useForm: (initial) => mockUseForm(initial) ?? { post: mockPost, processing: false },
    Link: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

describe('Suggestions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUsePage.mockReturnValue({
            props: {
                problem: 'Find element in sorted array.',
                suggestions: [
                    {
                        name: 'Binary Search',
                        complexity_time: 'O(log n)',
                        complexity_space: 'O(1)',
                        description: 'Fits when the array is sorted.',
                        when_best: 'Sorted array.',
                        benchmark_key: 'binary_search',
                    },
                ],
                ollamaAvailable: true,
            },
        });
        mockUseForm.mockReturnValue({
            post: mockPost,
            processing: false,
        });
    });

    it('renders problem and suggestions', () => {
        render(<Suggestions />);
        expect(screen.getByText('Find element in sorted array.')).toBeInTheDocument();
        expect(screen.getByText('Binary Search')).toBeInTheDocument();
        expect(screen.getByText(/O\(log n\)/)).toBeInTheDocument();
        expect(screen.getByText(/Fits when the array is sorted/)).toBeInTheDocument();
    });

    it('renders benchmark button and submits to /benchmark', () => {
        render(<Suggestions />);
        const btn = screen.getByRole('button', { name: /تشغيل محاكاة الأداء/ });
        expect(btn).toBeInTheDocument();
        fireEvent.click(btn);
        expect(mockPost).toHaveBeenCalledWith('/benchmark', expect.any(Object));
    });

    it('shows processing state on button', () => {
        mockUseForm.mockReturnValue({ post: mockPost, processing: true });
        render(<Suggestions />);
        expect(screen.getByRole('button', { name: /جاري تشغيل المحاكاة/ })).toBeInTheDocument();
    });

    it('renders multiple suggestions', () => {
        mockUsePage.mockReturnValue({
            props: {
                problem: 'Sort and search.',
                suggestions: [
                    { name: 'Quick Sort', complexity_time: 'O(n log n)', complexity_space: 'O(1)', description: 'Fast.', when_best: 'General.', benchmark_key: 'sorting' },
                    { name: 'Binary Search', complexity_time: 'O(log n)', complexity_space: 'O(1)', description: 'Sorted.', when_best: 'Sorted.', benchmark_key: 'binary_search' },
                ],
                ollamaAvailable: true,
            },
        });
        render(<Suggestions />);
        expect(screen.getByText('Quick Sort')).toBeInTheDocument();
        expect(screen.getByText('Binary Search')).toBeInTheDocument();
    });

    it('renders suggestion without benchmark_key', () => {
        mockUsePage.mockReturnValue({
            props: {
                problem: 'Some problem.',
                suggestions: [
                    { name: 'Custom', complexity_time: 'O(n)', complexity_space: 'O(1)', description: 'D', when_best: 'W' },
                ],
                ollamaAvailable: true,
            },
        });
        render(<Suggestions />);
        expect(screen.getByText('Custom')).toBeInTheDocument();
    });

    it('renders when ollamaAvailable is false', () => {
        mockUsePage.mockReturnValue({
            props: {
                problem: 'P',
                suggestions: [{ name: 'A', complexity_time: 'O(1)', complexity_space: 'O(1)', description: 'd', when_best: 'w', benchmark_key: 'sorting' }],
                ollamaAvailable: false,
            },
        });
        render(<Suggestions />);
        expect(screen.getByText('P')).toBeInTheDocument();
    });

    it('section heading اقتراحات الخوارزميات is present', () => {
        render(<Suggestions />);
        expect(screen.getByText('خوارزميات مقترحة')).toBeInTheDocument();
    });

    it('when_best text is displayed', () => {
        render(<Suggestions />);
        expect(screen.getByText(/متى تكون الأنسب/)).toBeInTheDocument();
    });

    it('renders with empty suggestions array', () => {
        mockUsePage.mockReturnValue({
            props: { problem: 'P', suggestions: [], ollamaAvailable: true },
        });
        render(<Suggestions />);
        expect(screen.getByText('P')).toBeInTheDocument();
        expect(screen.getByText('خوارزميات مقترحة')).toBeInTheDocument();
    });

    it('renders with null/undefined suggestions using optional chaining', () => {
        mockUsePage.mockReturnValue({
            props: { problem: 'P', suggestions: null, ollamaAvailable: true },
        });
        render(<Suggestions />);
        expect(screen.getByText('P')).toBeInTheDocument();
    });
});
