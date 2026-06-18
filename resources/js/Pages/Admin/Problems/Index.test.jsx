import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import AdminProblemsIndex from './Index';
import { UiLocaleProvider } from '@/lib/ui-locale';

const mockUsePage = vi.fn();

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    useForm: () => ({ processing: false, delete: vi.fn() }),
    Link: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

function renderPage(props, locale = 'en') {
    mockUsePage.mockReturnValue({ props });
    return render(
        <UiLocaleProvider locale={locale}>
            <AdminProblemsIndex />
        </UiLocaleProvider>,
    );
}

describe('Admin/Problems/Index', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders visibility, difficulty, and date fields', () => {
        renderPage({
            flash: null,
            problems: {
                total: 2,
                data: [
                    { id: 1, title: 'Public', slug: 'public', difficulty: 'easy', is_public: true, published_at: '2026-06-15T10:00:00Z', published_from_contest_id: null, created_at: '2026-06-15T10:00:00Z' },
                    { id: 2, title: 'Hidden', slug: 'hidden', difficulty: 'extreme', is_public: false, published_at: null, published_from_contest_id: 7, created_at: '2026-06-15T10:00:00Z' },
                ],
                links: [],
            },
        });

        expect(screen.getByText('Published')).toBeInTheDocument();
        expect(screen.getByText('Contest-only')).toBeInTheDocument();
        expect(screen.getByText('Hidden until contest ends')).toBeInTheDocument();
        expect(screen.getByText('Easy')).toBeInTheDocument();
        expect(screen.getByText('Extreme')).toBeInTheDocument();
        expect(screen.getByText(/Published:/)).toBeInTheDocument();
        expect(screen.getByText(/Created:/)).toBeInTheDocument();
    });
});
