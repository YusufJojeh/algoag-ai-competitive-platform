import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ProblemsIndex from './Index';
import { UiLocaleProvider } from '@/lib/ui-locale';

const mockUsePage = vi.fn();

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    useForm: () => ({ processing: false, post: vi.fn() }),
    Link: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

describe('Problems/Index', () => {
    it('renders published problems and does not render hidden contest-only problems absent from props', () => {
        mockUsePage.mockReturnValue({
            props: {
                problems: [
                    {
                        id: 1,
                        title: 'Extreme Published',
                        difficulty: 'extreme',
                        time_label: 'published',
                        time_at: '2026-06-15T10:00:00Z',
                        tags: [],
                    },
                ],
            },
        });

        render(
            <UiLocaleProvider locale="en">
                <ProblemsIndex />
            </UiLocaleProvider>,
        );

        expect(screen.getByText('Extreme Published')).toBeInTheDocument();
        expect(screen.getByText('Extreme')).toBeInTheDocument();
        expect(screen.getByText(/Published:/)).toBeInTheDocument();
        expect(screen.queryByText('Hidden Contest Problem')).not.toBeInTheDocument();
        expect(screen.queryByText(/Created:/)).not.toBeInTheDocument();
    });
});
