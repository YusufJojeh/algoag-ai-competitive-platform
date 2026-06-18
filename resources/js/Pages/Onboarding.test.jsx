import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import Onboarding from './Onboarding';
import { UiLocaleProvider } from '@/lib/ui-locale';

const mockUsePage = vi.fn();
const mockPost = vi.hoisted(() => vi.fn());

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    Head: ({ title }) => <title>{title}</title>,
    Link: ({ href, children, onClick, ...rest }) => (
        <a href={href} onClick={onClick} {...rest}>{children}</a>
    ),
    router: { post: mockPost },
    useForm: () => ({ data: {}, setData: vi.fn(), post: vi.fn(), processing: false, errors: {} }),
}));

function renderPage(locale = 'en') {
    mockUsePage.mockReturnValue({ props: { auth: { user: { id: 1, name: 'Yusuf' } }, uiLocale: locale } });
    return render(
        <UiLocaleProvider locale={locale}>
            <Onboarding />
        </UiLocaleProvider>,
    );
}

async function waitForStepTransition() {
    await act(async () => {
        await new Promise((r) => setTimeout(r, 250));
    });
}

describe('Onboarding page - English', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders welcome heading', () => {
        renderPage('en');
        expect(screen.getByText(/Welcome to ALGOAG/)).toBeInTheDocument();
    });

    it('shows user name in welcome heading', () => {
        renderPage('en');
        expect(screen.getByText(/Yusuf/)).toBeInTheDocument();
    });

    it('renders first step: goal options', () => {
        renderPage('en');
        expect(screen.getByText('What is your main goal?')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Learn algorithms' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Prepare for contests' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Practice problem solving' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Explore AI explanations' })).toBeInTheDocument();
    });

    it('advances to step 2 (level) after selecting goal', async () => {
        renderPage('en');
        fireEvent.click(screen.getByRole('button', { name: 'Learn algorithms' }));
        await waitForStepTransition();
        expect(screen.getByText('What is your current level?')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Beginner' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Intermediate' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Advanced' })).toBeInTheDocument();
    });

    it('advances to step 3 (language) after selecting level', async () => {
        renderPage('en');
        fireEvent.click(screen.getByRole('button', { name: 'Learn algorithms' }));
        await waitForStepTransition();
        fireEvent.click(screen.getByRole('button', { name: 'Beginner' }));
        await waitForStepTransition();
        expect(screen.getByText('Preferred submission language?')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Python' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'C++' })).toBeInTheDocument();
    });

    it('language options include both Python and C++', async () => {
        renderPage('en');
        fireEvent.click(screen.getByRole('button', { name: 'Learn algorithms' }));
        await waitForStepTransition();
        fireEvent.click(screen.getByRole('button', { name: 'Beginner' }));
        await waitForStepTransition();
        expect(screen.getByRole('button', { name: 'Python' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'C++' })).toBeInTheDocument();
    });

    it('shows first-run banner after completing all steps', async () => {
        renderPage('en');
        fireEvent.click(screen.getByRole('button', { name: 'Learn algorithms' }));
        await waitForStepTransition();
        fireEvent.click(screen.getByRole('button', { name: 'Beginner' }));
        await waitForStepTransition();
        fireEvent.click(screen.getByRole('button', { name: 'Python' }));
        await waitForStepTransition();
        expect(screen.getByText('Start clean')).toBeInTheDocument();
        expect(screen.getByText(/Solve one problem, submit your code/)).toBeInTheDocument();
    });

    it('skip goes directly to first-run banner without completing steps', () => {
        renderPage('en');
        fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
        expect(screen.getByText('Start clean')).toBeInTheDocument();
    });

    it('shows recommended action links on final screen', () => {
        renderPage('en');
        fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
        expect(screen.getByText('Solve A Plus B')).toBeInTheDocument();
        expect(screen.getByText('Enter Arena')).toBeInTheDocument();
        expect(screen.getByText('Ask AI Assistant')).toBeInTheDocument();
    });

    it('Solve A Plus B link points to /problems/a-plus-b', () => {
        renderPage('en');
        fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
        expect(screen.getByRole('link', { name: 'Solve A Plus B' })).toHaveAttribute('href', '/problems/a-plus-b');
    });

    it('Enter Arena link points to /arena', () => {
        renderPage('en');
        fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
        expect(screen.getByRole('link', { name: 'Enter Arena' })).toHaveAttribute('href', '/arena');
    });

    it('Ask AI Assistant link points to /assistant', () => {
        renderPage('en');
        fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
        expect(screen.getByRole('link', { name: 'Ask AI Assistant' })).toHaveAttribute('href', '/assistant');
    });

    it('Start Training button calls router.post on final screen', () => {
        renderPage('en');
        fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
        fireEvent.click(screen.getByRole('button', { name: 'Start Training' }));
        expect(mockPost).toHaveBeenCalledWith('/onboarding', expect.any(Object), expect.any(Object));
    });

    it('progress bar renders 4 segments (3 steps + done)', () => {
        renderPage('en');
        const bars = document.querySelectorAll('.h-1\\.5.flex-1');
        expect(bars.length).toBe(4);
    });
});

describe('Onboarding page - Arabic', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders Arabic welcome heading', () => {
        renderPage('ar');
        expect(screen.getByText(/أهلاً بك في ALGOAG/)).toBeInTheDocument();
    });

    it('renders Arabic first step label', () => {
        renderPage('ar');
        expect(screen.getByText('ما هدفك الرئيسي؟')).toBeInTheDocument();
    });

    it('renders Arabic goal options including تعلم الخوارزميات', () => {
        renderPage('ar');
        expect(screen.getByRole('button', { name: 'تعلم الخوارزميات' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'الاستعداد للمسابقات' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'حل مسائل برمجية' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'استكشاف تفسيرات AI' })).toBeInTheDocument();
    });

    it('renders C++ and Python options in Arabic language step', async () => {
        renderPage('ar');
        fireEvent.click(screen.getByRole('button', { name: 'تعلم الخوارزميات' }));
        await waitForStepTransition();
        fireEvent.click(screen.getByRole('button', { name: 'مبتدئ' }));
        await waitForStepTransition();
        expect(screen.getByRole('button', { name: 'C++' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Python' })).toBeInTheDocument();
    });

    it('shows Arabic banner text on skip', () => {
        renderPage('ar');
        fireEvent.click(screen.getByRole('button', { name: 'تخطّ' }));
        expect(screen.getByText('ابدأ صح')).toBeInTheDocument();
    });

    it('dir attribute is rtl in Arabic', () => {
        renderPage('ar');
        const container = document.querySelector('[dir="rtl"]');
        expect(container).toBeInTheDocument();
    });

    it('skip calls router.post to /onboarding in Arabic', () => {
        renderPage('ar');
        fireEvent.click(screen.getByRole('button', { name: 'تخطّ' }));
        fireEvent.click(screen.getByRole('button', { name: 'ابدأ التدريب' }));
        expect(mockPost).toHaveBeenCalledWith('/onboarding', expect.any(Object), expect.any(Object));
    });
});
