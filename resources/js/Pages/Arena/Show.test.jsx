import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    afterEach(() => vi.useRealTimers());

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
                    { id: 1, label: 'A', title: 'A Plus B', slug: 'a-plus-b', difficulty: null, can_open: true, your_status: 'accepted' },
                    { id: 2, label: 'B', title: 'Pairs', slug: 'pairs', difficulty: null, can_open: true, your_status: null },
                ],
            },
        });
        renderPage();
        expect(screen.getByText('A Plus B')).toBeInTheDocument();
        expect(screen.getByText('Accepted')).toBeInTheDocument();
        expect(screen.queryByText('easy')).not.toBeInTheDocument();
        const open = screen.getAllByText('Open')[0].closest('a');
        expect(open).toHaveAttribute('href', '/arena/r1/problems/1');
    });

    it('shows the join button and no open links when not joined, and posts on join', () => {
        mockUsePage.mockReturnValue({
            props: {
                joined: false,
                contest: { slug: 'r1', title: 'Round 1', status: 'running' },
                problems: [{ id: 1, label: 'A', title: 'A Plus B', slug: 'a-plus-b', difficulty: null, can_open: false, your_status: null }],
            },
        });
        renderPage();
        expect(screen.getByText('Join the contest to access its problems and submit.')).toBeInTheDocument();
        expect(screen.queryByText('Open')).not.toBeInTheDocument();

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

    it('renders running remaining time', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
        mockUsePage.mockReturnValue({
            props: {
                joined: true,
                contest: {
                    slug: 'r1',
                    title: 'Round 1',
                    status: 'running',
                    is_practice: false,
                    starts_at: '2026-06-15T09:00:00Z',
                    ends_at: '2026-06-15T10:30:00Z',
                },
                problems: [],
            },
        });
        renderPage();
        expect(screen.getByText(/Ends in: 30m/)).toBeInTheDocument();
    });

    it('renders time until start for not-started contests', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
        mockUsePage.mockReturnValue({
            props: {
                joined: true,
                contest: {
                    slug: 'r1',
                    title: 'Round 1',
                    status: 'upcoming',
                    is_practice: false,
                    starts_at: '2026-06-15T10:15:00Z',
                    ends_at: '2026-06-15T11:15:00Z',
                },
                problems: [],
            },
        });
        renderPage();
        expect(screen.getByText(/Starts at: 15m/)).toBeInTheDocument();
    });

    it('shows names but no open button before start', () => {
        mockUsePage.mockReturnValue({
            props: {
                joined: true,
                contest: { slug: 'r1', title: 'Round 1', status: 'upcoming', is_practice: false },
                problems: [{ id: 1, label: 'A', title: 'A Plus B', slug: 'a-plus-b', difficulty: null, can_open: false, your_status: null }],
            },
        });
        renderPage();
        expect(screen.getByText('A Plus B')).toBeInTheDocument();
        expect(screen.queryByText('Open')).not.toBeInTheDocument();
    });

    it('renders ended status', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
        mockUsePage.mockReturnValue({
            props: {
                joined: true,
                contest: {
                    slug: 'r1',
                    title: 'Round 1',
                    status: 'ended',
                    is_practice: false,
                    starts_at: '2026-06-15T08:00:00Z',
                    ends_at: '2026-06-15T09:00:00Z',
                },
                problems: [],
            },
        });
        renderPage();
        expect(screen.getAllByText('Ended').length).toBeGreaterThan(0);
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
