import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import AdminUsersIndex from './Index';
import { UiLocaleProvider } from '@/lib/ui-locale';

const mockUsePage = vi.fn();

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    useForm: (data) => ({ data, processing: false, put: vi.fn() }),
    Link: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

function renderPage(props) {
    mockUsePage.mockReturnValue({ props });
    return render(
        <UiLocaleProvider locale="en">
            <AdminUsersIndex />
        </UiLocaleProvider>,
    );
}

describe('Admin/Users/Index', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders title, user rows, roles, and actions cleanly', () => {
        renderPage({
            flash: null,
            users: {
                data: [
                    {
                        id: 1,
                        name: 'Admin User',
                        email: 'admin@example.com',
                        is_admin: true,
                        algorithm_sessions_count: 2,
                        codeforces_solutions_count: 3,
                        submissions_count: 4,
                    },
                ],
            },
        });

        expect(screen.getByRole('heading', { name: 'User management' })).toBeInTheDocument();
        expect(screen.getByText('Admin User')).toBeInTheDocument();
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Remove admin' })).toBeInTheDocument();
    });
});
