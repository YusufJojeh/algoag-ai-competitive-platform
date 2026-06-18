import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import Register from './Register';
import { UiLocaleProvider } from '@/lib/ui-locale';

const mockPost = vi.fn();

vi.mock('@inertiajs/react', () => ({
    Head: ({ title }) => <title>{title}</title>,
    Link: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
    useForm: (initial) => ({
        data: initial,
        setData: vi.fn(),
        post: mockPost,
        processing: false,
        errors: {},
    }),
}));

function renderPage(locale = 'en') {
    return render(
        <UiLocaleProvider locale={locale}>
            <Register />
        </UiLocaleProvider>,
    );
}

describe('Auth/Register', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders the register page', () => {
        renderPage();
        expect(screen.getByText('Create your account to access the assistant')).toBeInTheDocument();
    });

    it('renders the main form fields', () => {
        renderPage();
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
    });

    it('renders the submit button', () => {
        renderPage();
        expect(screen.getByRole('button', { name: /Create account/ })).toBeInTheDocument();
    });
});
