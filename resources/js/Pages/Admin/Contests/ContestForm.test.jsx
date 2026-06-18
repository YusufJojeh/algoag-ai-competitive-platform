import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import ContestForm from './ContestForm';
import { UiLocaleProvider } from '@/lib/ui-locale';

const mockPost = vi.fn();
const mockPut = vi.fn();
const mockSetData = vi.fn();

vi.mock('@inertiajs/react', () => ({
    useForm: (initial) => ({
        data: {
            title: initial.title ?? '',
            slug: initial.slug ?? '',
            description: initial.description ?? '',
            starts_at: initial.starts_at ?? '',
            duration_hours: initial.duration_hours ?? 0,
            duration_minutes: initial.duration_minutes ?? 30,
            is_public: initial.is_public ?? true,
            is_practice: initial.is_practice ?? false,
            problems: initial.problems ?? [],
            contest_only_problems: initial.contest_only_problems ?? [],
        },
        setData: mockSetData,
        post: mockPost,
        put: mockPut,
        processing: false,
        errors: {},
    }),
    Link: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

const available = [{ id: 1, title: 'A Plus B', slug: 'a-plus-b' }, { id: 2, title: 'Pairs', slug: 'pairs' }];

function renderForm(initialData, method = 'post', action = '/admin/contests', locale = 'en') {
    return render(
        <UiLocaleProvider locale={locale}>
            <ContestForm
                initialData={initialData}
                availableProblems={available}
                scheduling={{ timezone: 'Asia/Damascus', server_now: '2026-06-18T12:00', minimum_starts_at: '2026-06-18T12:02' }}
                submitLabel="Save"
                method={method}
                action={action}
            />
        </UiLocaleProvider>,
    );
}

describe('Admin/Contests/ContestForm', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders empty problems state and posts on submit', () => {
        renderForm({});
        expect(screen.getAllByText('No problems added.')).toHaveLength(2);
        fireEvent.submit(screen.getByText('Save').closest('form'));
        expect(mockPost).toHaveBeenCalledWith('/admin/contests');
    });

    it('adds a problem row via the add button', () => {
        renderForm({});
        fireEvent.click(screen.getByText('Add problem'));
        expect(mockSetData).toHaveBeenCalledWith('problems', [{ problem_id: 1, label: '' }]);
    });

    it('renders existing problem rows, updates and removes them, and puts on submit', () => {
        renderForm({ problems: [{ problem_id: 1, label: 'A' }] }, 'put', '/admin/contests/9');

        fireEvent.change(screen.getByDisplayValue('A Plus B'), { target: { value: '2' } });
        expect(mockSetData).toHaveBeenCalledWith('problems', [{ problem_id: 2, label: 'A' }]);

        fireEvent.change(screen.getByDisplayValue('A'), { target: { value: 'B' } });
        expect(mockSetData).toHaveBeenCalledWith('problems', [{ problem_id: 1, label: 'B' }]);

        fireEvent.click(screen.getByText('Remove'));
        expect(mockSetData).toHaveBeenCalledWith('problems', []);

        fireEvent.submit(screen.getByText('Save').closest('form'));
        expect(mockPut).toHaveBeenCalledWith('/admin/contests/9');
    });

    it('updates simple fields and toggles public and practice mode', () => {
        renderForm({});
        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Round X' } });
        expect(mockSetData).toHaveBeenCalledWith('title', 'Round X');
        fireEvent.click(screen.getByLabelText('Public'));
        expect(mockSetData).toHaveBeenCalledWith('is_public', false);
        fireEvent.click(screen.getByLabelText('Practice mode'));
        expect(mockSetData).toHaveBeenCalledWith('is_practice', true);
    });

    it('replaces the manual end time input with duration controls and preview', () => {
        renderForm({ starts_at: '2026-06-18T10:00', duration_hours: 1, duration_minutes: 15 });

        expect(screen.queryByLabelText('Ends at')).not.toBeInTheDocument();
        expect(screen.queryByDisplayValue('2026-06-18T11:15')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Duration hours')).toHaveValue(1);
        expect(screen.getByLabelText('Duration minutes')).toHaveValue(15);
        expect(screen.getByText(/Contest end time will be calculated automatically/)).toBeInTheDocument();
        expect(screen.getByText(/Calculated end time/)).toBeInTheDocument();
    });

    it('loads duration from existing starts_at and ends_at when edit data has no duration fields', () => {
        renderForm({ starts_at: '2026-06-18T10:00', ends_at: '2026-06-18T11:15' });

        expect(screen.getByLabelText('Duration hours')).toHaveValue(1);
        expect(screen.getByLabelText('Duration minutes')).toHaveValue(15);
    });

    it('shows a frontend validation message when duration is below two minutes', () => {
        renderForm({ duration_hours: 0, duration_minutes: 1 });

        fireEvent.submit(screen.getByText('Save').closest('form'));

        expect(screen.getByText('Contest duration must be at least two minutes.')).toBeInTheDocument();
        expect(mockPost).not.toHaveBeenCalled();
    });

    it('uses the backend-provided two-minute minimum without a three-hour jump', () => {
        renderForm({});
        const input = screen.getByLabelText('Starts at');

        expect(input).toHaveAttribute('min', '2026-06-18T12:02');

        fireEvent.change(input, { target: { value: '2026-06-18T12:01' } });
        expect(mockSetData).toHaveBeenCalledWith('starts_at', '2026-06-18T12:02');
        expect(mockSetData).not.toHaveBeenCalledWith('starts_at', '2026-06-18T15:00');
        expect(screen.getByText('Start time was adjusted to be at least two minutes from now.')).toBeInTheDocument();
    });

    it('keeps an admin-selected start time that is after the two-minute minimum', () => {
        renderForm({});

        fireEvent.change(screen.getByLabelText('Starts at'), { target: { value: '2026-06-18T12:03' } });

        expect(mockSetData).toHaveBeenCalledWith('starts_at', '2026-06-18T12:03');
        expect(mockSetData).not.toHaveBeenCalledWith('starts_at', '2026-06-18T15:00');
    });

    it('adds and removes contest-only problems', () => {
        renderForm({});
        fireEvent.click(screen.getByText('Add contest-only problem'));
        expect(mockSetData).toHaveBeenCalledWith('contest_only_problems', [{
            label: '',
            title: '',
            statement: '',
            difficulty: 'easy',
            time_limit_ms: 1000,
            memory_limit_mb: 256,
            test_cases: [],
        }]);

        renderForm({ contest_only_problems: [{ label: 'A', title: 'Hidden', statement: 'S', difficulty: 'easy', time_limit_ms: 1000, memory_limit_mb: 256, test_cases: [] }] });
        expect(screen.getByText('Hidden until contest ends')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Remove'));
        expect(mockSetData).toHaveBeenCalledWith('contest_only_problems', []);
    });
});
