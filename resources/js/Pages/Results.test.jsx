import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Results from './Results';

const mockUsePage = vi.fn();

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    Link: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

describe('Results', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUsePage.mockReturnValue({
            props: {
                problem: 'Sort an array.',
                suggestions: [{ name: 'Quicksort', benchmark_key: 'sorting' }],
                benchmarkResults: {
                    sorting: { time_ms: 2.5, memory_mb: 0.01, n: 1000 },
                },
                recommendation: 'Use Quicksort for best average performance.',
                sessionId: 1,
            },
        });
    });

    it('renders problem and recommendation', () => {
        render(<Results />);
        expect(screen.getByText('Sort an array.')).toBeInTheDocument();
        expect(screen.getByText(/Use Quicksort for best average performance/)).toBeInTheDocument();
    });

    it('renders benchmark table', () => {
        render(<Results />);
        expect(screen.getByText('مقارنة الأداء (محاكاة)')).toBeInTheDocument();
        expect(screen.getByText('sorting')).toBeInTheDocument();
        expect(screen.getByText('2.5')).toBeInTheDocument();
        expect(screen.getByText('1000')).toBeInTheDocument();
    });

    it('shows session saved message when sessionId present', () => {
        render(<Results />);
        expect(screen.getByText(/تم حفظ هذه الجلسة/)).toBeInTheDocument();
    });

    it('does not show session saved when sessionId is null', () => {
        mockUsePage.mockReturnValue({
            props: {
                problem: 'P',
                suggestions: [],
                benchmarkResults: {},
                recommendation: 'R',
                sessionId: null,
            },
        });
        render(<Results />);
        expect(screen.queryByText(/تم حفظ هذه الجلسة/)).not.toBeInTheDocument();
    });

    it('renders link to new problem', () => {
        render(<Results />);
        const link = screen.getByRole('link', { name: /مسألة جديدة/ });
        expect(link).toHaveAttribute('href', '/assistant');
    });

    it('renders when benchmarkResults is empty object', () => {
        mockUsePage.mockReturnValue({
            props: {
                problem: 'P',
                suggestions: [],
                benchmarkResults: {},
                recommendation: 'R',
                sessionId: null,
            },
        });
        render(<Results />);
        expect(screen.getByText('P')).toBeInTheDocument();
    });

    it('renders empty recommendation when recommendation is empty string', () => {
        mockUsePage.mockReturnValue({
            props: {
                problem: 'P',
                suggestions: [],
                benchmarkResults: {},
                recommendation: '',
                sessionId: null,
            },
        });
        render(<Results />);
        expect(screen.queryByText('التوصية النهائية')).not.toBeInTheDocument();
    });

    it('renders benchmark result row with error', () => {
        mockUsePage.mockReturnValue({
            props: {
                problem: 'P',
                suggestions: [],
                benchmarkResults: {
                    bad_key: { time_ms: 0, memory_mb: 0, n: 100, error: 'Algorithm not found' },
                },
                recommendation: '',
                sessionId: null,
            },
        });
        render(<Results />);
        expect(screen.getByText('bad_key')).toBeInTheDocument();
        expect(screen.getByText('Algorithm not found')).toBeInTheDocument();
    });

    it('renders multiple benchmark result rows', () => {
        mockUsePage.mockReturnValue({
            props: {
                problem: 'P',
                suggestions: [],
                benchmarkResults: {
                    sorting: { time_ms: 1, memory_mb: 0.01, n: 100 },
                    binary_search: { time_ms: 0.5, memory_mb: 0.005, n: 100 },
                },
                recommendation: 'R',
                sessionId: null,
            },
        });
        render(<Results />);
        expect(screen.getByText('sorting')).toBeInTheDocument();
        expect(screen.getByText('binary_search')).toBeInTheDocument();
        expect(screen.getByText('0.5')).toBeInTheDocument();
    });

    it('renders table headers', () => {
        render(<Results />);
        expect(screen.getByText('الوقت (ms)')).toBeInTheDocument();
        expect(screen.getByText('الذاكرة (MB)')).toBeInTheDocument();
        expect(screen.getByText('حجم n')).toBeInTheDocument();
    });

    it('renders when benchmarkResults is null or undefined', () => {
        mockUsePage.mockReturnValue({
            props: {
                problem: 'P',
                suggestions: [],
                benchmarkResults: null,
                recommendation: 'R',
                sessionId: null,
            },
        });
        render(<Results />);
        expect(screen.getByText('P')).toBeInTheDocument();
    });
});
