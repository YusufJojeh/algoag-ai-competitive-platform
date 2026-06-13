import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import ContestForm from './ContestForm';
import { UiLocaleProvider } from '@/lib/ui-locale';

const mockPost = vi.fn();
const mockPut = vi.fn();
const mockSetData = vi.fn();
let currentData;

vi.mock('@inertiajs/react', () => ({
    useForm: (initial) => {
        currentData = {
            title: initial.title ?? '',
            slug: initial.slug ?? '',
            description: initial.description ?? '',
            starts_at: initial.starts_at ?? '',
            ends_at: initial.ends_at ?? '',
            is_public: initial.is_public ?? true,
            problems: initial.problems ?? [],
        };
        return { data: currentData, setData: mockSetData, post: mockPost, put: mockPut, processing: false, errors: {} };
    },
    Link: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

const available = [{ id: 1, title: 'A Plus B', slug: 'a-plus-b' }, { id: 2, title: 'Pairs', slug: 'pairs' }];

function renderForm(initialData, method = 'post', action = '/admin/contests', locale = 'en') {
    return render(
        <UiLocaleProvider locale={locale}>
            <ContestForm initialData={initialData} availableProblems={available} submitLabel="Save" method={method} action={action} />
        </UiLocaleProvider>,
    );
}

describe('Admin/Contests/ContestForm', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders empty problems state and posts on submit', () => {
        renderForm({});
        expect(screen.getByText('No problems added.')).toBeInTheDocument();
        fireEvent.submit(screen.getByText('Save').closest('form'));
        expect(mockPost).toHaveBeenCalledWith('/admin/contests');
    });

    it('adds a problem row via the add button', () => {
        renderForm({});
        fireEvent.click(screen.getByText('Add problem'));
        expect(mockSetData).toHaveBeenCalledWith('problems', [{ problem_id: 1, label: '' }]);
    });

    it('renders existing problem rows, updates and removes them, and puts on submit', () => {
        renderForm({ problems: [{ problem_id: 1, label: 'A' }] }, 'put', '/admin/contests/9', 'ar');

        // select change -> updateProblem
        fireEvent.change(screen.getByDisplayValue('A Plus B'), { target: { value: '2' } });
        expect(mockSetData).toHaveBeenCalledWith('problems', [{ problem_id: 2, label: 'A' }]);

        // label change -> updateProblem
        fireEvent.change(screen.getByDisplayValue('A'), { target: { value: 'B' } });
        expect(mockSetData).toHaveBeenCalledWith('problems', [{ problem_id: 1, label: 'B' }]);

        // remove -> removeProblem
        fireEvent.click(screen.getByText('حذف'));
        expect(mockSetData).toHaveBeenCalledWith('problems', []);

        fireEvent.submit(screen.getByText('Save').closest('form'));
        expect(mockPut).toHaveBeenCalledWith('/admin/contests/9');
    });

    it('updates simple fields and toggles public', () => {
        renderForm({});
        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Round X' } });
        expect(mockSetData).toHaveBeenCalledWith('title', 'Round X');
        fireEvent.click(screen.getByRole('checkbox'));
        expect(mockSetData).toHaveBeenCalledWith('is_public', false);
    });
});
