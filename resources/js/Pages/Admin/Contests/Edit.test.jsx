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
                contest: { id: 9, title: 'Round 9', slug: 'r9', description: '', starts_at: '', ends_at: '', is_public: true, problems: [] },
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
    });

    it('renders Arabic title and tolerates missing availableProblems', () => {
        mockUsePage.mockReturnValue({
            props: { contest: { id: 9, title: 'جولة', slug: 'r9', is_public: false, problems: [] } },
        });
        render(
            <UiLocaleProvider locale="ar">
                <AdminContestsEdit />
            </UiLocaleProvider>,
        );
        expect(screen.getByText('تعديل المسابقة')).toBeInTheDocument();
    });
});
