import { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpLeft, Code2, Shield, Trophy } from 'lucide-react';

import MotionReveal from '@/components/landing/MotionReveal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';

interface HeroSectionProps {
    isAuthenticated: boolean;
    disable3D?: boolean;
}

const copy = {
    ar: {
        badge: 'منصة تدريب تنافسية + مساعد AI',
        headline1: 'تدرّب مثل منصات البرمجة التنافسية…',
        headline2: 'لكن مع مساعد AI يفهم طريقة تفكيرك.',
        subheadline: 'ALGOAG يجمع بين بنك مسائل، حكم محلي لحلول Python و C++، مسابقات تدريبية، لوحة ترتيب، ومساعد ذكي يشرح لك الفكرة بدل ما يعطيك الجواب فقط.',
        primaryGuest: 'ابدأ التدريب',
        primaryAuth: 'حل مسألة',
        secondaryGuest: 'ادخل الساحة',
        secondaryAuth: 'الساحة',
        howItWorks: 'كيف يعمل',
        stats: [
            { label: 'الحكم المحلي', value: 'Python و C++ على جهازك مباشرة' },
            { label: 'مسابقات تدريبية', value: 'انضم، أرسل، تابع الترتيب' },
            { label: 'مساعد AI', value: 'تلميحات وشرح التفكير لا مجرد إجابات' },
        ],
        cards: [
            { title: 'حكم Python و C++ محلياً', body: 'أرسل حلولك وشاهد النتيجة فوراً: قبول، إجابة خاطئة، TLE، أو خطأ ترجمة — بدون خادم خارجي.', tone: 'cyan' },
            { title: 'مسابقات بنظام Codeforces', body: 'انضم للمسابقة، أرسل خلال الوقت المحدد، وتابع الترتيب ICPC مع حساب الـ penalty.', tone: 'violet' },
            { title: 'الاختبارات المخفية محمية', body: 'المسائل لها اختبارات عامة ومخفية. المخفية لا تُكشف أبداً للمستخدمين العاديين.', tone: 'neutral' },
        ],
    },
    en: {
        badge: 'Competitive Programming Arena + AI Coach',
        headline1: 'Train like a competitive programmer —',
        headline2: 'with an AI coach that helps you think better.',
        subheadline: 'ALGOAG combines problem practice, local Python/C++ judging, mini contests, standings, and an AI assistant that helps you understand the approach — not just copy an answer.',
        primaryGuest: 'Start Training',
        primaryAuth: 'Solve a problem',
        secondaryGuest: 'Enter Arena',
        secondaryAuth: 'Arena',
        howItWorks: 'How it works',
        stats: [
            { label: 'Local judging', value: 'Python and C++ on your machine' },
            { label: 'Mini contests', value: 'Join, submit, track standings' },
            { label: 'AI coach', value: 'Hints and reasoning, not just answers' },
        ],
        cards: [
            { title: 'Local Python & C++ judging', body: 'Submit solutions and see verdicts instantly: Accepted, Wrong Answer, TLE, or Compilation Error — no external server.', tone: 'cyan' },
            { title: 'Codeforces-style contests', body: 'Join a contest, submit within the time window, and follow ICPC-style standings with penalty scoring.', tone: 'violet' },
            { title: 'Hidden tests stay hidden', body: 'Problems have public sample and hidden test cases. Hidden I/O is never exposed to regular users.', tone: 'neutral' },
        ],
    },
} as const;

const cardBorder: Record<string, string> = {
    cyan: 'border-cyan-300/18 bg-cyan-400/8',
    violet: 'border-violet-300/18 bg-violet-400/8',
    neutral: 'border-white/10 bg-white/[0.04]',
};

const cardIconColor: Record<string, string> = {
    cyan: 'text-cyan-200',
    violet: 'text-violet-200',
    neutral: 'text-slate-300',
};

export default function HeroSection({ isAuthenticated, disable3D = false }: HeroSectionProps) {
    const { locale } = useUiLocale();
    const reduceMotion = useReducedMotion();
    const t = copy[locale];

    const primaryHref = useMemo(() => (isAuthenticated ? '/problems' : '/register'), [isAuthenticated]);
    const primaryLabel = isAuthenticated ? t.primaryAuth : t.primaryGuest;
    const secondaryHref = isAuthenticated ? '/arena' : '/arena';
    const secondaryLabel = isAuthenticated ? t.secondaryAuth : t.secondaryGuest;

    const cardIcons = [Code2, Trophy, Shield];

    return (
        <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16" id="hero">
            <div className="mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="relative z-10">
                    <MotionReveal className="max-w-3xl">
                        <Badge className="mb-6 w-fit gap-2 rounded-full px-4 py-1.5 text-[11px] tracking-[0.3em]" variant="violet">
                            {t.badge}
                        </Badge>
                        <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl">
                            <span className="landing-text-gradient">{t.headline1}</span>
                            <br />
                            <span className="landing-text-gradient-cyan">{t.headline2}</span>
                        </h1>
                        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                            {t.subheadline}
                        </p>
                    </MotionReveal>

                    <MotionReveal delay={0.1} className="mt-8 flex flex-wrap gap-3">
                        <Button asChild size="lg">
                            <Link href={primaryHref}>{primaryLabel}</Link>
                        </Button>
                        <Button asChild variant="secondary" size="lg">
                            <Link href={secondaryHref}>{secondaryLabel}</Link>
                        </Button>
                        <Button asChild variant="ghost" size="lg">
                            <a href="#how-it-works" className="group">
                                {t.howItWorks}
                                <ArrowUpLeft className="flip-rtl transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5" />
                            </a>
                        </Button>
                    </MotionReveal>

                    <MotionReveal delay={0.18} className="mt-10 grid gap-3 sm:grid-cols-3">
                        {t.stats.map((item) => (
                            <div key={item.label} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                                <p className="mt-2 text-sm leading-6 text-slate-200">{item.value}</p>
                            </div>
                        ))}
                    </MotionReveal>

                    <MotionReveal delay={0.26} className="mt-10 grid gap-4 md:grid-cols-3">
                        {t.cards.map((card, i) => {
                            const Icon = cardIcons[i];
                            return (
                                <div key={card.title} className={`rounded-[28px] border p-5 ${cardBorder[card.tone]}`}>
                                    <Icon className={`size-5 ${cardIconColor[card.tone]}`} />
                                    <p className="mt-4 text-sm font-medium text-white">{card.title}</p>
                                    <p className="mt-2 text-sm leading-6 text-slate-300">{card.body}</p>
                                </div>
                            );
                        })}
                    </MotionReveal>
                </div>

                <MotionReveal delay={0.12} className="relative lg:min-h-[680px]" data-static-hero={disable3D ? 'true' : 'false'}>
                    <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_30px_120px_rgba(2,6,23,0.75)] backdrop-blur-xl">
                        <motion.div
                            animate={reduceMotion ? { opacity: 1 } : { opacity: [0.4, 0.75, 0.4], scale: [0.97, 1, 0.97] }}
                            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                            className="absolute inset-x-8 top-8 h-40 rounded-full bg-violet-500/18 blur-3xl"
                        />
                        <div className="relative space-y-3">
                            {/* Arena standings mock */}
                            <div className="rounded-[22px] border border-white/8 bg-slate-900/60 p-4 backdrop-blur">
                                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{locale === 'ar' ? 'الترتيب — جولة المبتدئين' : 'Standings — Beginners Round'}</p>
                                {[
                                    { rank: 1, name: 'Alice', solved: 3, penalty: 47 },
                                    { rank: 2, name: 'Bob', solved: 3, penalty: 93 },
                                    { rank: 3, name: 'Carol', solved: 2, penalty: 30 },
                                ].map((row) => (
                                    <div key={row.rank} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm even:bg-white/[0.03]">
                                        <span className="w-5 shrink-0 font-mono text-slate-400">#{row.rank}</span>
                                        <span className="flex-1 text-slate-200">{row.name}</span>
                                        <span className="font-mono text-emerald-300">{row.solved}</span>
                                        <span className="font-mono text-slate-400">{row.penalty}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Judge verdict mock */}
                            <div className="rounded-[22px] border border-white/8 bg-slate-900/60 p-4 backdrop-blur">
                                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{locale === 'ar' ? 'نتيجة الإرسال' : 'Submission result'}</p>
                                <div className="flex items-center justify-between">
                                    <code className="text-sm text-slate-300">a, b = map(int, input().split())<br />print(a + b)</code>
                                    <span className="rounded-xl bg-emerald-500/18 px-3 py-1 text-xs font-semibold text-emerald-300">{locale === 'ar' ? 'قبول' : 'Accepted'}</span>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">{locale === 'ar' ? 'Python · 42ms · 3/3 اختبارات' : 'Python · 42ms · 3/3 tests'}</p>
                            </div>
                            {/* AI hint mock */}
                            <div className="rounded-[22px] border border-violet-500/18 bg-violet-500/6 p-4 backdrop-blur">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">{locale === 'ar' ? 'مساعد AI — تلميح' : 'AI Coach — hint'}</p>
                                <p className="text-sm leading-6 text-slate-300">
                                    {locale === 'ar'
                                        ? 'فكّر في الحالة الحدية عندما يكون أحد العناصر سالباً. هل الجمع البسيط يعطي النتيجة الصحيحة دائماً؟'
                                        : 'Think about the edge case when one element is negative. Does simple addition always produce the correct result?'}
                                </p>
                            </div>
                        </div>
                    </div>
                </MotionReveal>
            </div>
        </section>
    );
}
