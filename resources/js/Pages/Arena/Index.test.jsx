import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import ArenaIndex from './Index';
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
            <ArenaIndex />
        </UiLocaleProvider>,
    );
}

describe('Arena/Index', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders empty state when there are no contests', () => {
        mockUsePage.mockReturnValue({ props: { contests: [] } });
        renderPage();
        expect(screen.getByText('No contests yet.')).toBeInTheDocument();
    });

    it('lists contests with status badge and problem count', () => {
        mockUsePage.mockReturnValue({
            props: {
                contests: [
                    { slug: 'r1', title: 'Round 1', description: 'desc', status: 'running', problems_count: 3 },
                    { slug: 'r2', title: 'Round 2', description: null, status: 'ended', problems_count: 0 },
                ],
            },
        });
        renderPage();
        expect(screen.getByText('Round 1')).toBeInTheDocument();
        expect(screen.getByText('Running')).toBeInTheDocument();
        expect(screen.getByText('Ended')).toBeInTheDocument();
        expect(screen.getByText('desc')).toBeInTheDocument();
    });

    it('renders Arabic labels', () => {
        mockUsePage.mockReturnValue({ props: { contests: [] } });
        renderPage('ar');
        expect(screen.getByText('لا توجد مسابقات بعد.')).toBeInTheDocument();
    });
});
