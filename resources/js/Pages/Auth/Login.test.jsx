import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import Login from './Login';
import { UiLocaleProvider } from '@/lib/ui-locale';

const mockUsePage = vi.fn();
const mockPost = vi.fn();

vi.mock('@inertiajs/react', () => ({
    Head: ({ title }) => <title>{title}</title>,
    Link: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
    usePage: () => mockUsePage(),
    useForm: (initial) => ({
        data: initial,
        setData: vi.fn(),
        post: mockPost,
        processing: false,
        errors: {},
    }),
}));

function renderPage(locale = 'en') {
    mockUsePage.mockReturnValue({ props: {} });

    return render(
        <UiLocaleProvider locale={locale}>
            <Login />
        </UiLocaleProvider>,
    );
}

describe('Auth/Login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('ResizeObserver', class {
            observe() {}
            unobserve() {}
            disconnect() {}
        });
    });

    it('renders the login page', () => {
        renderPage();
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
        expect(screen.getByText('Welcome back')).toBeInTheDocument();
    });

    it('renders the main form fields', () => {
        renderPage();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByText('Remember me on this device')).toBeInTheDocument();
    });

    it('renders the submit button', () => {
        renderPage();
        expect(screen.getByRole('button', { name: 'Enter workspace' })).toBeInTheDocument();
    });
});
