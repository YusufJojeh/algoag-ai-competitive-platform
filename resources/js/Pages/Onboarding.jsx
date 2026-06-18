import { useEffect, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { BrainCircuit, CheckCircle2, Code2, Trophy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';

const copy = {
    ar: {
        title: 'ALGOAG - ابدأ',
        welcome: 'أهلاً بك في ALGOAG',
        subtitle: 'دقيقة واحدة لنفهم أهدافك ونوجّهك للخطوة الصحيحة.',
        steps: [
            {
                id: 'goal',
                label: 'ما هدفك الرئيسي؟',
                options: [
                    { value: 'learn', label: 'تعلم الخوارزميات' },
                    { value: 'contests', label: 'الاستعداد للمسابقات' },
                    { value: 'practice', label: 'حل مسائل برمجية' },
                    { value: 'ai', label: 'استكشاف تفسيرات AI' },
                ],
            },
            {
                id: 'level',
                label: 'ما مستواك الحالي؟',
                options: [
                    { value: 'beginner', label: 'مبتدئ' },
                    { value: 'intermediate', label: 'متوسط' },
                    { value: 'advanced', label: 'متقدم' },
                ],
            },
            {
                id: 'language',
                label: 'لغة الحل المفضلة؟',
                options: [
                    { value: 'python', label: 'Python' },
                    { value: 'cpp', label: 'C++' },
                ],
            },
        ],
        action: 'الخطوة الأولى الموصى بها',
        actions: [
            { value: 'problem', label: 'حل مسألة A Plus B', href: '/problems/a-plus-b', icon: Code2 },
            { value: 'arena', label: 'ادخل الساحة', href: '/arena', icon: Trophy },
            { value: 'assistant', label: 'اسأل مساعد AI', href: '/assistant', icon: BrainCircuit },
        ],
        bannerTitle: 'ابدأ صح',
        bannerBody: 'حل مسألة بسيطة، أرسل الكود، شاهد الحكم، ثم ادخل أول مسابقة تدريبية.',
        next: 'التالي',
        skip: 'تخطّ',
        done: 'ابدأ التدريب',
    },
    en: {
        title: 'ALGOAG - Get started',
        welcome: 'Welcome to ALGOAG',
        subtitle: 'One minute to set your goal and get pointed in the right direction.',
        steps: [
            {
                id: 'goal',
                label: 'What is your main goal?',
                options: [
                    { value: 'learn', label: 'Learn algorithms' },
                    { value: 'contests', label: 'Prepare for contests' },
                    { value: 'practice', label: 'Practice problem solving' },
                    { value: 'ai', label: 'Explore AI explanations' },
                ],
            },
            {
                id: 'level',
                label: 'What is your current level?',
                options: [
                    { value: 'beginner', label: 'Beginner' },
                    { value: 'intermediate', label: 'Intermediate' },
                    { value: 'advanced', label: 'Advanced' },
                ],
            },
            {
                id: 'language',
                label: 'Preferred submission language?',
                options: [
                    { value: 'python', label: 'Python' },
                    { value: 'cpp', label: 'C++' },
                ],
            },
        ],
        action: 'Recommended first action',
        actions: [
            { value: 'problem', label: 'Solve A Plus B', href: '/problems/a-plus-b', icon: Code2 },
            { value: 'arena', label: 'Enter Arena', href: '/arena', icon: Trophy },
            { value: 'assistant', label: 'Ask AI Assistant', href: '/assistant', icon: BrainCircuit },
        ],
        bannerTitle: 'Start clean',
        bannerBody: 'Solve one problem, submit your code, review the verdict, then join your first practice arena.',
        next: 'Next',
        skip: 'Skip',
        done: 'Start Training',
    },
};

export default function Onboarding() {
    const { locale, isRtl } = useUiLocale();
    const t = copy[locale];
    const { auth } = usePage().props;
    const timerRef = useRef(null);

    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({});

    const totalSteps = t.steps.length;
    const isDone = step >= totalSteps;
    const currentStep = isDone ? null : t.steps[step];

    useEffect(() => () => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
        }
    }, []);

    function selectOption(value) {
        const id = currentStep?.id;
        if (!id) return;

        setAnswers((prev) => ({ ...prev, [id]: value }));
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
        }
        timerRef.current = window.setTimeout(() => {
            setStep((current) => (current < totalSteps - 1 ? current + 1 : totalSteps));
            timerRef.current = null;
        }, 180);
    }

    function skip() {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setStep(totalSteps);
    }

    function complete() {
        router.post('/onboarding', { ...answers, locale }, { preserveScroll: false });
    }

    return (
        <>
            <Head title={t.title} />
            <div className="app-shell-bg min-h-screen px-4 py-8 lg:px-6" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-xl">
                    <div className="mb-8 flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-cyan-200">
                            <BrainCircuit className="size-5" />
                        </div>
                        <p className="text-sm font-semibold tracking-[0.2em] text-slate-400">ALGOAG</p>
                    </div>

                    <div className="mb-8">
                        <Badge variant="violet" className="mb-3">{locale === 'ar' ? 'إعداد الحساب' : 'Account setup'}</Badge>
                        <h1 className="text-3xl font-semibold text-[var(--app-foreground)]">
                            {t.welcome}{auth?.user?.name ? `, ${auth.user.name}` : ''}
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">{t.subtitle}</p>
                    </div>

                    <div className="mb-8 flex gap-2">
                        {t.steps.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                                    i < step ? 'bg-cyan-400' : i === step ? 'bg-violet-400' : 'bg-white/10'
                                }`}
                            />
                        ))}
                        <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${isDone ? 'bg-emerald-400' : 'bg-white/10'}`} />
                    </div>

                    {!isDone && currentStep && (
                        <div className="rounded-[32px] border border-[var(--app-border)] bg-slate-950/72 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.42)] sm:p-8">
                            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-muted)]">
                                {step + 1} / {totalSteps}
                            </p>
                            <h2 className="mb-5 text-xl font-semibold text-[var(--app-foreground)]">{currentStep.label}</h2>
                            <div className="flex flex-col gap-3">
                                {currentStep.options.map((opt) => {
                                    const isSelected = answers[currentStep.id] === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            data-option={opt.value}
                                            onClick={() => selectOption(opt.value)}
                                            className={`w-full rounded-2xl border px-4 py-3 text-start text-sm font-medium transition-colors ${
                                                isSelected
                                                    ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-100'
                                                    : 'border-[var(--app-border)] bg-white/[0.03] text-[var(--app-foreground)] hover:border-white/20 hover:bg-white/[0.06]'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-6 flex gap-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={skip}
                                    className="text-[var(--app-muted)]"
                                >
                                    {t.skip}
                                </Button>
                            </div>
                        </div>
                    )}

                    {isDone && (
                        <div className="flex flex-col gap-4">
                            <div className="rounded-[32px] border border-emerald-400/20 bg-emerald-400/8 p-6 sm:p-8">
                                <div className="flex items-center gap-2 text-emerald-300">
                                    <CheckCircle2 className="size-5" />
                                    <p className="text-sm font-semibold">{t.bannerTitle}</p>
                                </div>
                                <p className="mt-3 text-base leading-7 text-[var(--app-foreground)]">{t.bannerBody}</p>
                            </div>

                            <div className="rounded-[32px] border border-[var(--app-border)] bg-slate-950/72 p-6 sm:p-8">
                                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-muted)]">{t.action}</p>
                                <div className="flex flex-col gap-3">
                                    {t.actions.map((action) => {
                                        const Icon = action.icon;
                                        return (
                                            <Link
                                                key={action.value}
                                                href={action.href}
                                                onClick={complete}
                                                className="flex items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-white/[0.03] px-4 py-3 text-sm font-medium text-[var(--app-foreground)] transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                                            >
                                                <Icon className="size-4 shrink-0 text-cyan-200" />
                                                {action.label}
                                            </Link>
                                        );
                                    })}
                                </div>

                                <div className="mt-6">
                                    <Button type="button" variant="lavender" className="h-11 w-full rounded-2xl" onClick={complete}>
                                        {t.done}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
