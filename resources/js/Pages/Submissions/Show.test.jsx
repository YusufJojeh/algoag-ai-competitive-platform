import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import SubmissionsShow from './Show';
import { UiLocaleProvider } from '@/lib/ui-locale';

const mockUsePage = vi.fn();

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    useForm: () => ({ data: {}, setData: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), processing: false, errors: {} }),
    Link: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

function renderPage(locale = 'en') {
    return render(
        <UiLocaleProvider locale={locale}>
            <SubmissionsShow />
        </UiLocaleProvider>,
    );
}

describe('Submissions/Show', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders verdict, runtime, sample I/O and hides hidden I/O', () => {
        mockUsePage.mockReturnValue({
            props: {
                submission: {
                    id: 7,
                    language: 'python',
                    verdict: 'wrong_answer',
                    status: 'completed',
                    runtime_ms: 42,
                    code: 'print(1)',
                    message: 'Verdict: wrong_answer',
                    created_at: 'just now',
                    problem: { id: 3, title: 'A Plus B', slug: 'a-plus-b' },
                    cases: [
                        { index: 0, verdict: 'accepted', runtime_ms: 5, is_sample: true, input: '1 2', expected_output: '3' },
                        { index: 1, verdict: 'wrong_answer', runtime_ms: 6, is_sample: false, input: null, expected_output: null },
                    ],
                },
            },
        });
        renderPage();
        expect(screen.getAllByText('Wrong answer').length).toBeGreaterThan(0);
        expect(screen.getByText('1 2')).toBeInTheDocument();      // sample input exposed
        expect(screen.getByText('Sample')).toBeInTheDocument();
        expect(screen.getByText('Hidden')).toBeInTheDocument();
        expect(screen.getByText('print(1)')).toBeInTheDocument();
        expect(screen.getByText('Verdict: wrong_answer')).toBeInTheDocument();
    });

    it('handles missing problem, message, runtime and empty cases', () => {
        mockUsePage.mockReturnValue({
            props: {
                submission: {
                    id: 8,
                    language: 'cpp',
                    verdict: 'pending',
                    status: 'pending',
                    runtime_ms: null,
                    code: 'int main(){}',
                    message: null,
                    created_at: 'now',
                    problem: null,
                    cases: [],
                },
            },
        });
        renderPage('ar');
        expect(screen.getByText(/بدون مسألة مرتبطة/)).toBeInTheDocument();
        expect(screen.getByText('لا توجد نتائج لكل حالة.')).toBeInTheDocument();
    });
});
