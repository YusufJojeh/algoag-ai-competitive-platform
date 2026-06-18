import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Landing from './Landing';
import { UiLocaleProvider } from '@/lib/ui-locale';

const mockUsePage = vi.fn();

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    Head: ({ title }) => <title>{title}</title>,
    Link: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
    MotionConfig: ({ children }) => <>{children}</>,
    motion: {
        div: ({ children, ...rest }) => <div {...rest}>{children}</div>,
    },
    useReducedMotion: () => false,
    useMotionValue: () => ({ set: vi.fn() }),
    useTransform: () => 0,
    AnimatePresence: ({ children }) => <>{children}</>,
}));
vi.mock('@/components/landing/GradientBackground', () => ({ default: () => <div data-testid="gradient-bg" /> }));
vi.mock('@/components/landing/MotionReveal', () => ({ default: ({ children, ...rest }) => <div {...rest}>{children}</div> }));
vi.mock('@/components/landing/FloatingPanels', () => ({ default: () => null }));
vi.mock('@/components/layout/LanguageSwitch', () => ({
    LanguageSwitchButton: () => <button type="button">Lang</button>,
}));

function renderLanding(locale = 'en', isAuthenticated = false, topics = []) {
    mockUsePage.mockReturnValue({
        props: {
            auth: isAuthenticated ? { user: { id: 1, name: 'Alice', email: 'a@a.com', is_admin: false } } : { user: null },
            e2e: { disable3D: true },
            topics,
            uiLocale: locale,
        },
    });
    return render(
        <UiLocaleProvider locale={locale}>
            <Landing />
        </UiLocaleProvider>,
    );
}

describe('Landing page — English', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders the landing page root element', () => {
        renderLanding('en', false);
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    it('renders hero headline in English', () => {
        renderLanding('en', false);
        expect(screen.getAllByText(/Train like a competitive programmer/).length).toBeGreaterThan(0);
    });

    it('renders hero subheadline mentioning local judging', () => {
        renderLanding('en', false);
        // subheadline + feature grid both mention local judging — at least one must exist
        expect(screen.getAllByText(/local Python\/C\+\+ judging/i).length).toBeGreaterThan(0);
    });

    it('renders Start Training CTA link to /register for guests', () => {
        renderLanding('en', false);
        const links = screen.getAllByRole('link', { name: /Start Training/ });
        expect(links.some((l) => l.getAttribute('href') === '/register')).toBe(true);
    });

    it('renders Enter Arena CTA link to /arena for guests', () => {
        renderLanding('en', false);
        const links = screen.getAllByRole('link', { name: /Enter Arena/ });
        expect(links.some((l) => l.getAttribute('href') === '/arena')).toBe(true);
    });

    it('renders navigation link for Features section', () => {
        renderLanding('en', false);
        const link = screen.getByRole('link', { name: 'Features' });
        expect(link).toHaveAttribute('href', '#features');
    });

    it('renders navigation link for How it works section', () => {
        renderLanding('en', false);
        const links = screen.getAllByRole('link', { name: /How it works/i });
        expect(links.some((l) => l.getAttribute('href') === '#how-it-works')).toBe(true);
    });

    it('renders feature grid with 6 unique feature titles', () => {
        renderLanding('en', false);
        expect(screen.getAllByText('Real algorithm practice').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Local Python/C++ judging').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Mini contest arena').length).toBeGreaterThan(0);
        expect(screen.getAllByText('AI-assisted problem solving').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Admin test-case management').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Hidden tests stay hidden').length).toBeGreaterThan(0);
    });

    it('renders trust section with local judging disclaimer', () => {
        renderLanding('en', false);
        expect(screen.getByText('Local judging only')).toBeInTheDocument();
        expect(screen.getByText(/Production use requires a sandbox/)).toBeInTheDocument();
    });

    it('renders how-it-works section with Submit Python or C++ step', () => {
        renderLanding('en', false);
        expect(screen.getAllByText(/Submit Python or C\+\+/).length).toBeGreaterThan(0);
    });

    it('shows Solve a problem CTA linking to /problems when authenticated', () => {
        renderLanding('en', true);
        const links = screen.getAllByRole('link', { name: /Solve a problem/ });
        expect(links.some((l) => l.getAttribute('href') === '/problems')).toBe(true);
    });

    it('shows user name as link in header when authenticated', () => {
        renderLanding('en', true);
        expect(screen.getByRole('link', { name: 'Alice' })).toBeInTheDocument();
    });

    it('shows Log in link for guests', () => {
        renderLanding('en', false);
        const links = screen.getAllByRole('link', { name: /Log in/i });
        expect(links.length).toBeGreaterThan(0);
    });

    it('final CTA shows Enter Arena link', () => {
        renderLanding('en', false);
        const links = screen.getAllByRole('link', { name: /Enter Arena/ });
        expect(links.some((l) => l.getAttribute('href') === '/arena')).toBe(true);
    });

    it('shows Ask AI Assistant link for authenticated users in final CTA', () => {
        renderLanding('en', true);
        expect(screen.getByRole('link', { name: /Ask AI Assistant/ })).toBeInTheDocument();
    });

    it('ALGOAG brand text is present', () => {
        renderLanding('en', false);
        expect(screen.getAllByText('ALGOAG').length).toBeGreaterThan(0);
    });

    it('renders admin topics from landing props with problem filter links', () => {
        renderLanding('en', false, [{ id: 1, name: 'Two Pointers', slug: 'two-pointers', problems_count: 3 }]);

        const topic = screen.getByRole('link', { name: /Two Pointers/ });
        expect(topic).toHaveAttribute('href', '/problems?topic=two-pointers');
        expect(screen.getByText('(3)')).toBeInTheDocument();
    });
});

describe('Landing page — Arabic', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders hero headline in Arabic', () => {
        renderLanding('ar', false);
        expect(screen.getAllByText(/تدرّب مثل منصات البرمجة التنافسية/).length).toBeGreaterThan(0);
    });

    it('renders ابدأ التدريب CTA linking to /register for guests', () => {
        renderLanding('ar', false);
        const links = screen.getAllByRole('link', { name: /ابدأ التدريب/ });
        expect(links.some((l) => l.getAttribute('href') === '/register')).toBe(true);
    });

    it('renders ادخل الساحة CTA linking to /arena', () => {
        renderLanding('ar', false);
        const links = screen.getAllByRole('link', { name: /ادخل الساحة/ });
        expect(links.some((l) => l.getAttribute('href') === '/arena')).toBe(true);
    });

    it('renders Arabic feature titles in feature grid', () => {
        renderLanding('ar', false);
        expect(screen.getAllByText(/مسائل حقيقية/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/حكم محلي لحلول Python و C\+\+/).length).toBeGreaterThan(0);
    });

    it('trust section shows Arabic local judging note', () => {
        renderLanding('ar', false);
        expect(screen.getByText('الحكم المحلي فقط')).toBeInTheDocument();
    });

    it('root element has dir="rtl" in Arabic', () => {
        renderLanding('ar', false);
        expect(screen.getByTestId('landing-page')).toHaveAttribute('dir', 'rtl');
    });

    it('root element has dir="ltr" in English', () => {
        renderLanding('en', false);
        expect(screen.getByTestId('landing-page')).toHaveAttribute('dir', 'ltr');
    });
});
