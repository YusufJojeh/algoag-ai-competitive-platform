import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import ProblemForm from './ProblemForm';
import { UiLocaleProvider } from '@/lib/ui-locale';

const mockPost = vi.fn();
const mockPut = vi.fn();
const mockSetData = vi.fn();

vi.mock('@inertiajs/react', () => ({
    useForm: (initial) => ({
        data: {
            title: initial.title ?? '',
            slug: initial.slug ?? '',
            statement: initial.statement ?? '',
            difficulty: initial.difficulty ?? 'easy',
            time_limit_ms: initial.time_limit_ms ?? 1000,
            memory_limit_mb: initial.memory_limit_mb ?? 256,
            tag_ids: initial.tag_ids ?? [],
            test_cases: initial.test_cases ?? [],
        },
        setData: mockSetData,
        post: mockPost,
        put: mockPut,
        processing: false,
        errors: {},
    }),
    Link: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

const tags = [{ id: 1, name: 'Math', slug: 'math' }, { id: 2, name: 'Graphs', slug: 'graphs' }];

function renderForm(initialData, method = 'post', action = '/admin/problems', locale = 'en') {
    return render(
        <UiLocaleProvider locale={locale}>
            <ProblemForm initialData={initialData} availableTags={tags} submitLabel="Save" method={method} action={action} />
        </UiLocaleProvider>,
    );
}

describe('Admin/Problems/ProblemForm', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders empty test-case state and posts on submit', () => {
        renderForm({});
        expect(screen.getByText('No test cases yet.')).toBeInTheDocument();
        fireEvent.submit(screen.getByText('Save').closest('form'));
        expect(mockPost).toHaveBeenCalledWith('/admin/problems');
    });

    it('adds a test case row', () => {
        renderForm({});
        fireEvent.click(screen.getByText('Add test case'));
        expect(mockSetData).toHaveBeenCalledWith('test_cases', [{ input: '', expected_output: '', is_sample: false }]);
    });

    it('edits and removes existing test cases and updates base fields, then puts', () => {
        renderForm({ test_cases: [{ input: '1', expected_output: '2', is_sample: false }] }, 'put', '/admin/problems/5');

        fireEvent.change(screen.getByLabelText('Input'), { target: { value: '10' } });
        expect(mockSetData).toHaveBeenCalledWith('test_cases', [{ input: '10', expected_output: '2', is_sample: false }]);

        fireEvent.change(screen.getByLabelText('Expected output'), { target: { value: '20' } });
        expect(mockSetData).toHaveBeenCalledWith('test_cases', [{ input: '1', expected_output: '20', is_sample: false }]);

        fireEvent.click(screen.getByLabelText('Sample (public)'));
        expect(mockSetData).toHaveBeenCalledWith('test_cases', [{ input: '1', expected_output: '2', is_sample: true }]);

        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New' } });
        expect(mockSetData).toHaveBeenCalledWith('title', 'New');

        fireEvent.click(screen.getByText('Remove'));
        expect(mockSetData).toHaveBeenCalledWith('test_cases', []);

        fireEvent.submit(screen.getByText('Save').closest('form'));
        expect(mockPut).toHaveBeenCalledWith('/admin/problems/5');
    });

    it('updates numeric and difficulty fields', () => {
        renderForm({});
        expect(screen.getByRole('option', { name: 'Extreme' })).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText('Difficulty'), { target: { value: 'hard' } });
        expect(mockSetData).toHaveBeenCalledWith('difficulty', 'hard');
        fireEvent.change(screen.getByLabelText('Time limit (ms)'), { target: { value: '2000' } });
        expect(mockSetData).toHaveBeenCalledWith('time_limit_ms', 2000);
        fireEvent.change(screen.getByLabelText('Memory limit (MB)'), { target: { value: '512' } });
        expect(mockSetData).toHaveBeenCalledWith('memory_limit_mb', 512);
        fireEvent.change(screen.getByLabelText('Slug'), { target: { value: 'abc' } });
        expect(mockSetData).toHaveBeenCalledWith('slug', 'abc');
        fireEvent.change(screen.getByLabelText('Statement'), { target: { value: 'text' } });
        expect(mockSetData).toHaveBeenCalledWith('statement', 'text');
    });

    it('selects and unselects multiple tags', () => {
        renderForm({ tag_ids: [1] });
        fireEvent.click(screen.getByText('Graphs'));
        expect(mockSetData).toHaveBeenCalledWith('tag_ids', [1, 2]);
        fireEvent.click(screen.getAllByText('Math')[0]);
        expect(mockSetData).toHaveBeenCalledWith('tag_ids', []);
    });
});
