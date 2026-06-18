import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import AdminLayout from './AdminLayout';
import { UiLocaleProvider } from '@/lib/ui-locale';

vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

describe('AdminLayout', () => {
    it('renders management navigation in the approved order with settings last', () => {
        render(
            <UiLocaleProvider locale="en">
                <AdminLayout title="Admin">Content</AdminLayout>
            </UiLocaleProvider>,
        );

        const hrefs = screen
            .getAllByRole('link')
            .map((link) => link.getAttribute('href'))
            .filter((href) => ['/admin/users', '/admin/topics', '/admin/courses', '/admin/problems', '/admin/contests', '/admin/settings'].includes(href));

        expect(hrefs.slice(0, 6)).toEqual([
            '/admin/users',
            '/admin/topics',
            '/admin/courses',
            '/admin/problems',
            '/admin/contests',
            '/admin/settings',
        ]);
    });
});
