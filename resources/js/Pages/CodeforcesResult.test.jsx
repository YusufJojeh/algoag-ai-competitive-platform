import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CodeforcesResult from './CodeforcesResult';

const mockUsePage = vi.fn();
const mockReload = vi.fn();
const mockLink = ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>;

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    Link: (props) => mockLink(props),
    router: { reload: (...args) => mockReload(...args) },
}));

describe('CodeforcesResult', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUsePage.mockReturnValue({
            props: {
                statusPollUrl: null,
                solution: {
                    id: 1,
                    problem_text: 'Find max.',
                    parsed_problem: {
                        title: 'Max',
                        description: 'Find the maximum.',
                        input_format: 'n and array',
                        output_format: 'one number',
                        constraints: 'n <= 10^5',
                        examples: [{ input: '1\n2', output: '2' }],
                    },
                    solution_code: 'int main() {}',
                    solution_language: 'cpp',
                    explanation: 'شرح الحل',
                    generated_tests: [{ input: '1', expected_output: '1' }],
                    run_results: null,
                    algorithm_breakdown: 'خوارزمية O(n)',
                    status: 'completed',
                    error_message: null,
                    created_at: '2025-01-01T00:00:00Z',
                },
            },
        });
    });

    it('renders header and link to new problem', () => {
        render(<CodeforcesResult />);
        expect(screen.getByText('نتيجة الحل')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /مسألة جديدة/ })).toHaveAttribute('href', '/solve');
    });

    it('renders tab buttons when completed', () => {
        render(<CodeforcesResult />);
        expect(screen.getByRole('button', { name: 'المسألة' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'الحل' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'الشرح' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'الاختبارات' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'الحكم (وضع تجريبي)' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'الخوارزمية والتطويرات' })).toBeInTheDocument();
    });

    it('shows problem tab by default with parsed content', () => {
        render(<CodeforcesResult />);
        expect(screen.getByText('المسألة (المُحلَّلة)')).toBeInTheDocument();
        expect(screen.getByText('Max')).toBeInTheDocument();
        expect(screen.getByText('Find the maximum.')).toBeInTheDocument();
        expect(screen.getByText(/صيغة الإدخال/)).toBeInTheDocument();
        expect(screen.getByText('n and array')).toBeInTheDocument();
        expect(screen.getByText(/صيغة الإخراج/)).toBeInTheDocument();
        expect(screen.getByText('one number')).toBeInTheDocument();
        expect(screen.getByText(/القيود/)).toBeInTheDocument();
        expect(screen.getByText('n <= 10^5')).toBeInTheDocument();
        expect(screen.getByText('أمثلة:')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('switches to code tab on click', () => {
        render(<CodeforcesResult />);
        fireEvent.click(screen.getByRole('button', { name: 'الحل' }));
        expect(screen.getByText('كود الحل')).toBeInTheDocument();
        expect(screen.getByText(/int main\(\) \{\}/)).toBeInTheDocument();
        expect(screen.getByText('لغة: C++')).toBeInTheDocument();
    });

    it('switches to explanation tab', () => {
        render(<CodeforcesResult />);
        fireEvent.click(screen.getByRole('button', { name: 'الشرح' }));
        expect(screen.getByRole('heading', { name: 'الشرح' })).toBeInTheDocument();
        expect(screen.getByText('شرح الحل')).toBeInTheDocument();
    });

    it('switches to tests tab and shows generated tests', () => {
        render(<CodeforcesResult />);
        fireEvent.click(screen.getByRole('button', { name: 'الاختبارات' }));
        expect(screen.getByText('الاختبارات المُولَّدة')).toBeInTheDocument();
        expect(screen.getByText(/التحقق التلقائي من المخرجات غير مفعّل/)).toBeInTheDocument();
        expect(screen.getByText(/اختبار #1/)).toBeInTheDocument();
        expect(screen.getByText('Expected output:')).toBeInTheDocument();
        expect(screen.getByText('Input:')).toBeInTheDocument();
    });

    it('switches to algorithm tab', () => {
        render(<CodeforcesResult />);
        fireEvent.click(screen.getByRole('button', { name: 'الخوارزمية والتطويرات' }));
        expect(screen.getByText('الخوارزمية والتطويرات والفائدة')).toBeInTheDocument();
        expect(screen.getByText('خوارزمية O(n)')).toBeInTheDocument();
    });

    it('shows Python when solution_language is python', () => {
        mockUsePage.mockReturnValue({
            props: {
                solution: {
                    id: 1,
                    solution_code: 'print(1)',
                    solution_language: 'python',
                    status: 'completed',
                    parsed_problem: {},
                },
            },
        });
        render(<CodeforcesResult />);
        fireEvent.click(screen.getByRole('button', { name: 'الحل' }));
        expect(screen.getByText('لغة: Python')).toBeInTheDocument();
    });

    it('shows error message when status is failed', () => {
        mockUsePage.mockReturnValue({
            props: {
                solution: {
                    id: 1,
                    status: 'failed',
                    error_message: 'Ollama timeout',
                    parsed_problem: null,
                    solution_code: null,
                },
            },
        });
        render(<CodeforcesResult />);
        expect(screen.getByText(/فشل الحل/)).toBeInTheDocument();
        expect(screen.getByText('Ollama timeout')).toBeInTheDocument();
    });

    it('shows problem text when parsed has no title or description', () => {
        mockUsePage.mockReturnValue({
            props: {
                solution: {
                    id: 1,
                    problem_text: 'Raw problem text here.',
                    parsed_problem: { title: '', description: '' },
                    status: 'completed',
                },
            },
        });
        render(<CodeforcesResult />);
        expect(screen.getByText('النص الأصلي للمسألة:')).toBeInTheDocument();
        expect(screen.getByText('Raw problem text here.')).toBeInTheDocument();
    });

    it('shows no tests message when generated_tests is empty', () => {
        mockUsePage.mockReturnValue({
            props: {
                solution: {
                    id: 1,
                    generated_tests: [],
                    status: 'completed',
                    parsed_problem: {},
                    solution_code: 'code',
                },
            },
        });
        render(<CodeforcesResult />);
        fireEvent.click(screen.getByRole('button', { name: 'الاختبارات' }));
        expect(screen.getByText('لا توجد اختبارات.')).toBeInTheDocument();
    });

    it('renders link "حل مسألة أخرى" at bottom', () => {
        render(<CodeforcesResult />);
        const links = screen.getAllByRole('link', { name: /حل مسألة أخرى/ });
        expect(links.length).toBeGreaterThanOrEqual(1);
        expect(links[0]).toHaveAttribute('href', '/solve');
    });

    it('handles missing solution gracefully', () => {
        mockUsePage.mockReturnValue({ props: { solution: null } });
        render(<CodeforcesResult />);
        expect(screen.getByText('نتيجة الحل')).toBeInTheDocument();
    });

    it('shows code placeholder when solution_code empty', () => {
        mockUsePage.mockReturnValue({
            props: {
                solution: {
                    id: 1,
                    solution_code: null,
                    solution_language: 'cpp',
                    status: 'completed',
                    parsed_problem: {},
                },
            },
        });
        render(<CodeforcesResult />);
        fireEvent.click(screen.getByRole('button', { name: 'الحل' }));
        expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows placeholder when explanation is empty', () => {
        mockUsePage.mockReturnValue({
            props: {
                solution: {
                    id: 1,
                    status: 'completed',
                    explanation: '',
                    parsed_problem: {},
                    solution_code: 'code',
                },
            },
        });
        render(<CodeforcesResult />);
        fireEvent.click(screen.getByRole('button', { name: 'الشرح' }));
        expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows placeholder when algorithm_breakdown is empty', () => {
        mockUsePage.mockReturnValue({
            props: {
                solution: {
                    id: 1,
                    status: 'completed',
                    algorithm_breakdown: '',
                    parsed_problem: {},
                    solution_code: 'code',
                },
            },
        });
        render(<CodeforcesResult />);
        fireEvent.click(screen.getByRole('button', { name: 'الخوارزمية والتطويرات' }));
        expect(screen.getByText('—')).toBeInTheDocument();
    });
});
