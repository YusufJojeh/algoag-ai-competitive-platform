import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import AdminContestsIndex from './Index';
import { UiLocaleProvider } from '@/lib/ui-locale';

const mockUsePage = vi.fn();
const mockDelete = vi.fn();

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    useForm: () => ({ processing: false, delete: mockDelete }),
    Link: ({ href, children, preserveScroll, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

function renderPage(props, locale = 'en') {
    mockUsePage.mockReturnValue({ props });
    return render(
        <UiLocaleProvider locale={locale}>
            <AdminContestsIndex />
        </UiLocaleProvider>,
    );
}

describe('Admin/Contests/Index', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders empty state', () => {
        renderPage({ contests: { data: [], links: [] }, flash: null });
        expect(screen.getByText('No contests yet. Create the first one.')).toBeInTheDocument();
    });

    it('renders rows with flash, pagination, and confirms delete', () => {
        vi.stubGlobal('confirm', vi.fn(() => true));
        renderPage({
            flash: { message: 'Contest created.' },
            contests: {
                total: 1,
                data: [{ id: 1, title: 'Round 1', slug: 'r1', is_public: true, is_practice: true, problems_published_at: '2026-06-15T10:00:00Z' }],
                links: [
                    { label: '&laquo; Previous', url: null, active: false },
                    { label: '1', url: 'http://x/?page=1', active: true },
                    { label: 'Next &raquo;', url: 'http://x/?page=2', active: false },
                ],
            },
        });
        expect(screen.getByText('Contest created.')).toBeInTheDocument();
        expect(screen.getByText('Round 1')).toBeInTheDocument();
        expect(screen.getByText('Practice')).toBeInTheDocument();
        expect(screen.getByText('Problems published')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/admin/contests/r1/edit');
        fireEvent.click(screen.getByText('Delete'));
        expect(mockDelete).toHaveBeenCalledWith('/admin/contests/r1');
    });

    it('does not delete when not confirmed and renders private badge in Arabic', () => {
        vi.stubGlobal('confirm', vi.fn(() => false));
        renderPage({
            contests: { total: 1, data: [{ id: 2, title: 'Hidden', slug: 'h', is_public: false }], links: [] },
            flash: null,
        }, 'ar');
        expect(screen.getByText('خاص')).toBeInTheDocument();
        fireEvent.click(screen.getByText('حذف'));
        expect(mockDelete).not.toHaveBeenCalled();
    });
});
