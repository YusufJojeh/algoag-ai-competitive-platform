import { Head, Link, usePage } from '@inertiajs/react';
import { MotionConfig } from 'framer-motion';
import { ArrowUpLeft, BrainCircuit, Sparkles } from 'lucide-react';

import FeatureGrid from '@/components/landing/FeatureGrid';
import FinalCTA from '@/components/landing/FinalCTA';
import GradientBackground from '@/components/landing/GradientBackground';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorksTimeline from '@/components/landing/HowItWorksTimeline';
import TrustSection from '@/components/landing/TrustSection';
import ArenaOverview from '@/components/landing/VoiceVisionShowcase';
import { Button } from '@/components/ui/button';
import { LanguageSwitchButton } from '@/components/layout/LanguageSwitch';
import { useUiLocale } from '@/lib/ui-locale';

type AuthUser = {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
} | null;

type LandingPageProps = {
    auth?: {
        user?: AuthUser;
    };
    e2e?: {
        disable3D?: boolean;
    };
    topics?: Array<{
        id: number;
        name: string;
        slug: string;
        problems_count: number;
    }>;
};

export default function Landing() {
    const page = usePage<LandingPageProps>();
    const { auth, e2e, topics = [] } = page.props;
    const { locale, isRtl } = useUiLocale();
    const isAuthenticated = Boolean(auth?.user);
    const disable3D = Boolean(e2e?.disable3D);
    const navLinks = locale === 'ar'
        ? [
              { href: '#experience', label: 'المنصة' },
              { href: '#features', label: 'الميزات' },
              { href: '#how-it-works', label: 'كيف يعمل' },
              { href: '#trust', label: 'الأمان' },
          ]
        : [
              { href: '#experience', label: 'Platform' },
              { href: '#features', label: 'Features' },
              { href: '#how-it-works', label: 'How it works' },
              { href: '#trust', label: 'Safety' },
          ];

    return (
        <>
            <Head title={locale === 'ar' ? 'ALGOAG — منصة تدريب برمجة تنافسية + AI' : 'ALGOAG — Competitive Programming Arena + AI Coach'} />
            <MotionConfig reducedMotion="user">
                <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100" data-testid="landing-page" dir={isRtl ? 'rtl' : 'ltr'}>
                    <GradientBackground />

                    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/65 backdrop-blur-xl">
                        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
                            <Link href="/" className="flex items-center gap-3 text-white">
                                <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-cyan-200 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
                                    <BrainCircuit className="size-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold tracking-[0.2em] text-slate-300">ALGOAG</p>
                                    <p className="text-xs text-slate-400">
                                        {locale === 'ar' ? 'ساحة برمجة تنافسية + AI' : 'Competitive programming arena + AI'}
                                    </p>
                                </div>
                            </Link>

                            <div className="flex items-center gap-3">
                                <LanguageSwitchButton className="rounded-2xl border-white/10 bg-white/6 px-3" />
                                {isAuthenticated ? (
                                    <>
                                        <Button asChild variant="ghost" className="hidden sm:inline-flex">
                                            <Link href="/assistant">{auth?.user?.name}</Link>
                                        </Button>
                                        <Button asChild>
                                            <Link href="/problems">{locale === 'ar' ? 'حل مسألة' : 'Solve a problem'}</Link>
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button asChild variant="ghost" className="hidden sm:inline-flex">
                                            <Link href="/login">{locale === 'ar' ? 'تسجيل الدخول' : 'Log in'}</Link>
                                        </Button>
                                        <Button asChild>
                                            <Link href="/register">
                                                {locale === 'ar' ? 'ابدأ التدريب' : 'Start Training'}
                                                <Sparkles className="size-4" />
                                            </Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        <nav className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 pb-4 text-sm sm:px-6 lg:gap-6 lg:px-8">
                            {navLinks.map((item) => (
                                <a key={item.href} href={item.href} className="shrink-0 text-slate-300 transition hover:text-white">
                                    {item.label}
                                </a>
                            ))}
                        </nav>
                    </header>

                    <main className="relative z-10">
                        <HeroSection isAuthenticated={isAuthenticated} disable3D={disable3D} />
                        <section id="topics" className="px-4 py-16 sm:px-6 lg:px-8">
                            <div className="mx-auto max-w-7xl">
                                <div className="max-w-3xl">
                                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">
                                        {locale === 'ar' ? 'الموضوعات' : 'Topics'}
                                    </p>
                                    <h2 className="mt-3 text-3xl font-semibold text-white">
                                        {locale === 'ar' ? 'موضوعات الإدارة تظهر للطلاب مباشرة' : 'Admin topics feed the public problem flow'}
                                    </h2>
                                </div>
                                {topics.length > 0 ? (
                                    <div className="mt-8 flex flex-wrap gap-3">
                                        {topics.map((topic) => (
                                            <Link
                                                key={topic.id}
                                                href={`/problems?topic=${topic.slug}`}
                                                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-400/10"
                                            >
                                                <span className="font-medium">{topic.name}</span>
                                                <span className="ms-2 text-slate-400">({topic.problems_count})</span>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-6 text-sm text-slate-400">
                                        {locale === 'ar' ? 'لا توجد موضوعات منشأة من الإدارة بعد.' : 'No admin topics have been created yet.'}
                                    </p>
                                )}
                            </div>
                        </section>
                        <ArenaOverview />
                        <FeatureGrid />
                        <HowItWorksTimeline />
                        <TrustSection />
                        <FinalCTA isAuthenticated={isAuthenticated} />
                    </main>

                    <footer className="relative z-10 border-t border-white/10 px-4 py-8 sm:px-6 lg:px-8">
                        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                            <p>
                                {locale === 'ar'
                                    ? 'ALGOAG منصة تدريب برمجة تنافسية بحكم محلي Python/C++، مسابقات، ترتيب، ومساعد AI يشرح التفكير الخوارزمي.'
                                    : 'ALGOAG is a competitive programming training platform with local Python/C++ judging, contests, standings, and an AI coach that explains algorithmic thinking.'}
                            </p>
                            <div className="flex items-center gap-4">
                                <a href="#hero" className="inline-flex items-center gap-2 transition hover:text-white">
                                    {locale === 'ar' ? 'العودة للأعلى' : 'Back to top'}
                                    <ArrowUpLeft className="flip-rtl size-4" />
                                </a>
                                <Link href={isAuthenticated ? '/problems' : '/login'} className="transition hover:text-white">
                                    {isAuthenticated ? (locale === 'ar' ? 'المسائل' : 'Problems') : (locale === 'ar' ? 'تسجيل الدخول' : 'Log in')}
                                </Link>
                            </div>
                        </div>
                    </footer>
                </div>
            </MotionConfig>
        </>
    );
}
