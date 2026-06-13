import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import ArenaStandings from './Standings';
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
            <ArenaStandings />
        </UiLocaleProvider>,
    );
}

describe('Arena/Standings', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders empty state', () => {
        mockUsePage.mockReturnValue({ props: { contest: { slug: 'r1', title: 'R1' }, labels: [], rows: [] } });
        renderPage();
        expect(screen.getByText('No submissions yet.')).toBeInTheDocument();
    });

    it('renders standings table with accepted/wrong cells', () => {
        mockUsePage.mockReturnValue({
            props: {
                contest: { slug: 'r1', title: 'R1' },
                labels: [{ id: 1, label: 'A' }, { id: 2, label: 'B' }],
                rows: [
                    {
                        rank: 1, user_name: 'Fast', solved: 1, penalty: 10,
                        problems: [
                            { problem_id: 1, accepted: true, wrong: 0 },
                            { problem_id: 2, accepted: false, wrong: 2 },
                        ],
                    },
                    {
                        rank: 2, user_name: 'Slow', solved: 1, penalty: 50,
                        problems: [
                            { problem_id: 1, accepted: true, wrong: 1 },
                        ],
                    },
                ],
            },
        });
        renderPage('ar');
        expect(screen.getByText('Fast')).toBeInTheDocument();
        expect(screen.getByText('+')).toBeInTheDocument();   // accepted, no wrong
        expect(screen.getByText('-2')).toBeInTheDocument();  // not accepted, 2 wrong
        expect(screen.getByText('+1')).toBeInTheDocument();  // accepted after 1 wrong
    });
});
