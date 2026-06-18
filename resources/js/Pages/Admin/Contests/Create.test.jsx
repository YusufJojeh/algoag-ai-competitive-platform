import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import AdminContestsCreate from './Create';
import { UiLocaleProvider } from '@/lib/ui-locale';

const mockUsePage = vi.fn();

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    useForm: (initial) => ({ data: initial, setData: vi.fn(), post: vi.fn(), put: vi.fn(), processing: false, errors: {} }),
    Link: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

describe('Admin/Contests/Create', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders the create form', () => {
        mockUsePage.mockReturnValue({ props: { availableProblems: [] } });
        render(
            <UiLocaleProvider locale="en">
                <AdminContestsCreate />
            </UiLocaleProvider>,
        );
        expect(screen.getByRole('heading', { name: 'Create contest' })).toBeInTheDocument();
        expect(screen.getByLabelText('Duration hours')).toBeInTheDocument();
        expect(screen.getByLabelText('Duration minutes')).toBeInTheDocument();
    });

    it('renders Arabic form and tolerates missing availableProblems', () => {
        mockUsePage.mockReturnValue({ props: {} });
        render(
            <UiLocaleProvider locale="ar">
                <AdminContestsCreate />
            </UiLocaleProvider>,
        );
        expect(screen.getByRole('heading')).toBeInTheDocument();
    });
});
