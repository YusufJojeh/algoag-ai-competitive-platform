import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import ArenaShow from './Show';
import { UiLocaleProvider } from '@/lib/ui-locale';

const mockUsePage = vi.fn();
const mockPost = vi.fn();

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    useForm: () => ({ data: {}, setData: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), processing: false, errors: {} }),
    router: { post: (...args) => mockPost(...args) },
    Link: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

function renderPage(locale = 'en') {
    return render(
        <UiLocaleProvider locale={locale}>
            <ArenaShow />
        </UiLocaleProvider>,
    );
}

describe('Arena/Show', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders empty problems state', () => {
        mockUsePage.mockReturnValue({
            props: { contest: { slug: 'r1', title: 'Round 1', status: 'running' }, problems: [], joined: true },
        });
        renderPage();
        expect(screen.getByText('No problems in this contest yet.')).toBeInTheDocument();
    });

    it('renders problems with open links and your_status when joined', () => {
        mockUsePage.mockReturnValue({
            props: {
                joined: true,
                contest: { slug: 'r1', title: 'Round 1', status: 'running' },
                problems: [
                    { id: 1, label: 'A', title: 'A Plus B', slug: 'a-plus-b', difficulty: 'easy', your_status: 'accepted' },
                    { id: 2, label: 'B', title: 'Pairs', slug: 'pairs', difficulty: 'medium', your_status: null },
                ],
            },
        });
        renderPage();
        expect(screen.getByText('A Plus B')).toBeInTheDocument();
        expect(screen.getByText('Accepted')).toBeInTheDocument();
        const open = screen.getAllByText('Open')[0].closest('a');
        expect(open).toHaveAttribute('href', '/problems/a-plus-b?contest=r1');
    });

    it('shows the join button and disabled open links when not joined, and posts on join', () => {
        mockUsePage.mockReturnValue({
            props: {
                joined: false,
                contest: { slug: 'r1', title: 'Round 1', status: 'running' },
                problems: [{ id: 1, label: 'A', title: 'A Plus B', slug: 'a-plus-b', difficulty: 'easy', your_status: null }],
            },
        });
        renderPage();
        expect(screen.getByText('Join the contest to access its problems and submit.')).toBeInTheDocument();
        // Open is a disabled button (not a link) when not joined
        const open = screen.getByText('Open');
        expect(open.closest('a')).toBeNull();

        fireEvent.click(screen.getByText('Join contest'));
        expect(mockPost).toHaveBeenCalledWith('/arena/r1/join', {}, { preserveScroll: true });
    });

    it('renders the practice-mode badge for practice contests', () => {
        mockUsePage.mockReturnValue({
            props: { joined: true, contest: { slug: 'p1', title: 'Practice', status: 'running', is_practice: true }, problems: [] },
        });
        renderPage();
        expect(screen.getByText('Practice mode')).toBeInTheDocument();
    });

    it('renders timed status (Not started) and falls back for unknown status in Arabic', () => {
        mockUsePage.mockReturnValue({
            props: { joined: true, contest: { slug: 'r1', title: 'Round 1', status: 'upcoming', is_practice: false }, problems: [] },
        });
        renderPage();
        expect(screen.getByText('Not started')).toBeInTheDocument();

        mockUsePage.mockReturnValue({
            props: { joined: true, contest: { slug: 'r1', title: 'جولة', status: 'weird', is_practice: false }, problems: [] },
        });
        renderPage('ar');
        expect(screen.getByText('weird')).toBeInTheDocument();
    });
});
