import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import CodeforcesResult from './CodeforcesResult';
import { UiLocaleProvider } from '@/lib/ui-locale';

const mockUsePage = vi.fn();
const mockReload = vi.fn();
const mockLink = ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>;

vi.mock('@inertiajs/react', () => ({
    usePage: () => mockUsePage(),
    Link: (props) => mockLink(props),
    useForm: () => ({ post: vi.fn(), processing: false }),
    router: { reload: (...args) => mockReload(...args) },
}));

function renderPage(locale = 'ar') {
    return render(
        <UiLocaleProvider locale={locale}>
            <CodeforcesResult />
        </UiLocaleProvider>,
    );
}

describe('CodeforcesResult', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        });
        mockUsePage.mockReturnValue({
            props: {
                statusPollUrl: null,
                solution: {
                    id: 1,
                    problem_text: 'Find max.',
                    problem_text_translations: {
                        ar: 'أوجد أكبر قيمة.',
                        en: 'Find the maximum.',
                    },
                    parsed_problem: {
                        title: 'Max',
                        description: 'Find the maximum.',
                        input_format: 'n and array',
                        output_format: 'one number',
                        constraints: 'n <= 10^5',
                        examples: [{ input: '1\n2', output: '2' }],
                    },
                    parsed_problem_translations: {
                        ar: {
                            title: 'أكبر قيمة',
                            description: 'أوجد أكبر قيمة في المصفوفة.',
                            input_format: 'يعطى n ثم عناصر المصفوفة.',
                            output_format: 'اطبع رقما واحدا.',
                            constraints: 'n <= 10^5',
                            examples: [{ input: 'changed', output: 'changed' }],
                        },
                        en: {
                            title: 'Maximum',
                            description: 'Find the maximum value in the array.',
                            input_format: 'n and array',
                            output_format: 'print one number',
                            constraints: 'n <= 10^5',
                            examples: [{ input: 'changed', output: 'changed' }],
                        },
                    },
                    solution_code: 'int main() {}',
                    solution_language: 'cpp',
                    explanation: 'شرح الحل',
                    explanation_translations: {
                        ar: 'شرح عربي واضح',
                        en: 'Clear English explanation',
                    },
                    generated_tests: [{ input: '1', expected_output: '1' }],
                    run_results: null,
                    algorithm_breakdown: 'خوارزمية O(n)',
                    algorithm_breakdown_translations: {
                        ar: 'تحليل عربي للخوارزمية',
                        en: 'English algorithm analysis',
                    },
                    status: 'completed',
                    error_message: null,
                    created_at: '2025-01-01T00:00:00Z',
                },
            },
        });
    });

    it('renders readable Arabic header and new-problem link', () => {
        renderPage();
        expect(screen.getByText('نتيجة التحليل والتوليد')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'مسألة جديدة' })).toHaveAttribute('href', '/solve');
    });

    it('renders Arabic tab buttons when completed', () => {
        renderPage();
        expect(screen.getByRole('button', { name: 'المسألة' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'الحل' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'الشرح' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'الاختبارات' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'الحكم' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'الخوارزمية والتطويرات' })).toBeInTheDocument();
    });

    it('shows localized Arabic problem content while preserving original examples', () => {
        renderPage();
        expect(screen.getByText('المسألة المحللة')).toBeInTheDocument();
        expect(screen.getByText('أكبر قيمة')).toBeInTheDocument();
        expect(screen.getByText('أوجد أكبر قيمة في المصفوفة.')).toBeInTheDocument();
        expect(screen.getByText('يعطى n ثم عناصر المصفوفة.')).toBeInTheDocument();
        expect(screen.getByText('اطبع رقما واحدا.')).toBeInTheDocument();
        expect(screen.getByText('أمثلة:')).toBeInTheDocument();
        expect(screen.getByText(/1\s+2/)).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.queryByText('changed')).not.toBeInTheDocument();
    });

    it('switches to code tab', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: 'الحل' }));
        expect(screen.getByText('كود الحل')).toBeInTheDocument();
        expect(screen.getByText(/int main\(\) \{\}/)).toBeInTheDocument();
        expect(screen.getByText('اللغة: C++')).toBeInTheDocument();
    });

    it('uses localized explanation and algorithm notes', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: 'الشرح' }));
        expect(screen.getByText('شرح عربي واضح')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'الخوارزمية والتطويرات' }));
        expect(screen.getByText('تحليل عربي للخوارزمية')).toBeInTheDocument();
    });

    it('renders English localized content when UI locale is English', () => {
        renderPage('en');
        expect(screen.getByText('Analysis and generation result')).toBeInTheDocument();
        expect(screen.getByText('Maximum')).toBeInTheDocument();
        expect(screen.getByText('Find the maximum value in the array.')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Explanation' }));
        expect(screen.getByText('Clear English explanation')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Algorithm notes' }));
        expect(screen.getByText('English algorithm analysis')).toBeInTheDocument();
    });

    it('copies solution code from the code tab', async () => {
        renderPage('en');
        fireEvent.click(screen.getByRole('button', { name: 'Code' }));
        fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));

        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('int main() {}');
        });
        expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    });

    it('shows generated tests with readable Arabic labels', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: 'الاختبارات' }));
        expect(screen.getByText('الاختبارات المولدة')).toBeInTheDocument();
        expect(screen.getByText('اختبار #1')).toBeInTheDocument();
        expect(screen.getByText('الإدخال:')).toBeInTheDocument();
        expect(screen.getByText('المخرج المتوقع:')).toBeInTheDocument();
    });

    it('shows failed error message', () => {
        mockUsePage.mockReturnValue({
            props: {
                solution: {
                    id: 1,
                    status: 'failed',
                    error_message: 'تعذر إكمال العملية.',
                    parsed_problem: null,
                    solution_code: null,
                },
            },
        });
        renderPage();
        expect(screen.getByText(/فشل الحل/)).toBeInTheDocument();
        expect(screen.getByText('تعذر إكمال العملية.')).toBeInTheDocument();
    });

    it('falls back to localized raw problem text when parsed content is empty', () => {
        mockUsePage.mockReturnValue({
            props: {
                solution: {
                    id: 1,
                    problem_text: 'Raw problem text here.',
                    problem_text_translations: { ar: 'النص الخام للمسألة.' },
                    parsed_problem: { title: '', description: '' },
                    status: 'completed',
                },
            },
        });
        renderPage();
        expect(screen.getByText('النص الأصلي للمسألة:')).toBeInTheDocument();
        expect(screen.getByText('النص الخام للمسألة.')).toBeInTheDocument();
    });

    it('shows placeholders for empty generated sections', () => {
        mockUsePage.mockReturnValue({
            props: {
                solution: {
                    id: 1,
                    status: 'completed',
                    explanation: '',
                    algorithm_breakdown: '',
                    parsed_problem: {},
                    solution_code: null,
                    solution_language: 'cpp',
                },
            },
        });
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: 'الحل' }));
        expect(screen.getByText('-')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'الشرح' }));
        expect(screen.getByText('-')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'الخوارزمية والتطويرات' }));
        expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('handles missing solution gracefully', () => {
        mockUsePage.mockReturnValue({ props: { solution: null } });
        renderPage();
        expect(screen.getByText('نتيجة التحليل والتوليد')).toBeInTheDocument();
    });
});
