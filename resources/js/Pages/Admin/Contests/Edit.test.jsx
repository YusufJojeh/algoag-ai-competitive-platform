import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import AdminContestsEdit from './Edit';
import { UiLocaleProvider } from '@/lib/ui-locale';

const mockUsePage = vi.fn();

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    useForm: (initial) => ({ data: initial, setData: vi.fn(), post: vi.fn(), put: vi.fn(), processing: false, errors: {} }),
    Link: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

describe('Admin/Contests/Edit', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders the edit form with the contest title as subtitle', () => {
        mockUsePage.mockReturnValue({
            props: {
                contest: {
                    id: 9,
                    title: 'Round 9',
                    slug: 'r9',
                    description: '',
                    starts_at: '2026-06-18T10:00',
                    ends_at: '2026-06-18T11:15',
                    duration_hours: 1,
                    duration_minutes: 15,
                    is_public: true,
                    problems: [],
                },
                availableProblems: [{ id: 1, title: 'A', slug: 'a' }],
            },
        });
        render(
            <UiLocaleProvider locale="en">
                <AdminContestsEdit />
            </UiLocaleProvider>,
        );
        expect(screen.getByText('Edit contest')).toBeInTheDocument();
        expect(screen.getByText('Round 9')).toBeInTheDocument();
        expect(screen.getByLabelText('Duration hours')).toHaveValue(1);
        expect(screen.getByLabelText('Duration minutes')).toHaveValue(15);
    });

    it('renders Arabic form and tolerates missing availableProblems', () => {
        mockUsePage.mockReturnValue({
            props: { contest: { id: 9, title: 'Round', slug: 'r9', is_public: false, problems: [] } },
        });
        render(
            <UiLocaleProvider locale="ar">
                <AdminContestsEdit />
            </UiLocaleProvider>,
        );
        expect(screen.getByRole('heading')).toBeInTheDocument();
    });
});
