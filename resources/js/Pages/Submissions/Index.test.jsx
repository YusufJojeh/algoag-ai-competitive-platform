import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import SubmissionsIndex from './Index';
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
            <SubmissionsIndex />
        </UiLocaleProvider>,
    );
}

describe('Submissions/Index', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders empty state', () => {
        mockUsePage.mockReturnValue({ props: { submissions: [], flash: null } });
        renderPage();
        expect(screen.getByText('No submissions yet')).toBeInTheDocument();
    });

    it('renders submissions with verdict badge, flash, and handles missing problem', () => {
        mockUsePage.mockReturnValue({
            props: {
                flash: { message: 'Saved #1' },
                submissions: [
                    { id: 1, language: 'python', verdict: 'accepted', runtime_ms: 12, created_at: 'now', problem: { id: 3, title: 'A Plus B', slug: 'a-plus-b' } },
                    { id: 2, language: 'cpp', verdict: 'wrong_answer', runtime_ms: null, created_at: 'now', problem: null },
                ],
            },
        });
        renderPage('ar');
        expect(screen.getByText('Saved #1')).toBeInTheDocument();
        expect(screen.getByText('A Plus B')).toBeInTheDocument();
        expect(screen.getByText('مقبول')).toBeInTheDocument();
        expect(screen.getByText('بدون مسألة مرتبطة')).toBeInTheDocument();
        expect(screen.getByText('12 ms')).toBeInTheDocument();
    });
});
