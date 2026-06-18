import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import AdminSettings from './Settings';
import { UiLocaleProvider } from '@/lib/ui-locale';

const mockUsePage = vi.fn();

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    Link: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

describe('Admin/Settings', () => {
    it('renders grouped settings without a layout break', () => {
        mockUsePage.mockReturnValue({
            props: {
                settings: {
                    app: {
                        name: 'ALGOAG',
                        env: 'testing',
                        debug: false,
                        locale: 'en',
                        timezone: 'UTC',
                    },
                    limits: {
                        judge_enabled: false,
                        judge_timeout_seconds: 2,
                        assistant_max_audio_mb: 10,
                    },
                    services: [
                        { name: 'Database', status: 'online', detail: 'sqlite' },
                        { name: 'Queue', status: 'configured', detail: 'sync' },
                    ],
                },
            },
        });

        render(
            <UiLocaleProvider locale="en">
                <AdminSettings />
            </UiLocaleProvider>,
        );

        expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
        expect(screen.getByText('Application')).toBeInTheDocument();
        expect(screen.getByText('Runtime limits')).toBeInTheDocument();
        expect(screen.getByText('Services')).toBeInTheDocument();
        expect(screen.getByText('Database')).toBeInTheDocument();
        expect(screen.getByText('sqlite')).toBeInTheDocument();
    });
});
