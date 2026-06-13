import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import ProblemsShow from './Show';
import { UiLocaleProvider } from '@/lib/ui-locale';

const mockUsePage = vi.fn();
const mockPost = vi.fn();
let formData;

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    useForm: (initial) => {
        formData = { ...initial };
        return {
            data: formData,
            setData: (key, value) => { formData[key] = value; },
            post: mockPost,
            processing: false,
            errors: {},
        };
    },
    Link: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

function renderPage(props, locale = 'en') {
    mockUsePage.mockReturnValue({ props });
    return render(
        <UiLocaleProvider locale={locale}>
            <ProblemsShow />
        </UiLocaleProvider>,
    );
}

describe('Problems/Show', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders problem detail and submits the form', () => {
        renderPage({
            problem: { id: 5, title: 'A Plus B', slug: 'a-plus-b', statement: 'Add a and b', difficulty: 'easy', time_limit_ms: 1000, memory_limit_mb: 256, tags: [] },
            contest: null,
        });
        expect(screen.getByText('Add a and b')).toBeInTheDocument();

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: 'print(sum(map(int, input().split())))' } });
        fireEvent.submit(textarea.closest('form'));
        expect(mockPost).toHaveBeenCalledWith('/submissions');
    });

    it('shows the contest banner when submitting in a contest (Arabic)', () => {
        renderPage({
            problem: { id: 5, title: 'A Plus B', slug: 'a-plus-b', statement: 'x', difficulty: 'easy', time_limit_ms: 1000, memory_limit_mb: 256, tags: [] },
            contest: { id: 9, slug: 'r1', title: 'Round 1' },
        }, 'ar');
        const link = screen.getByText('Round 1').closest('a');
        expect(link).toHaveAttribute('href', '/arena/r1');
    });
});
