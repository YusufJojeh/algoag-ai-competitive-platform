import { Head, Link, usePage } from '@inertiajs/react';
import { MotionConfig } from 'framer-motion';
import { ArrowUpLeft, BrainCircuit, Sparkles } from 'lucide-react';

import FeatureGrid from '@/components/landing/FeatureGrid';
import FinalCTA from '@/components/landing/FinalCTA';
import GradientBackground from '@/components/landing/GradientBackground';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorksTimeline from '@/components/landing/HowItWorksTimeline';
import TrustSection from '@/components/landing/TrustSection';
import VoiceVisionShowcase from '@/components/landing/VoiceVisionShowcase';
import { Button } from '@/components/ui/button';
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
};

export default function Landing() {
    const page = usePage<LandingPageProps>();
    const { auth, e2e } = page.props;
    const { locale, isRtl } = useUiLocale();
    const isAuthenticated = Boolean(auth?.user);
    const disable3D = Boolean(e2e?.disable3D);
    const navLinks = locale === 'ar'
        ? [
              { href: '#experience', label: 'التجربة' },
              { href: '#features', label: 'الميزات' },
              { href: '#how-it-works', label: 'كيف يعمل' },
              { href: '#trust', label: 'الثقة' },
          ]
        : [
              { href: '#experience', label: 'Experience' },
              { href: '#features', label: 'Features' },
              { href: '#how-it-works', label: 'How it works' },
              { href: '#trust', label: 'Trust' },
          ];

    return (
        <>
            <Head title={locale === 'ar' ? 'مساعد حل المسائل الصوتي والبصري' : 'AI Problem-Solving Voice + Vision Assistant'} />
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
                                    <p className="text-xs text-slate-400">{locale === 'ar' ? 'حل مسائل بالصوت والرؤية' : 'Voice + Vision problem solving'}</p>
                                </div>
                            </Link>

                            <nav className="hidden items-center gap-6 lg:flex">
                                {navLinks.map((item) => (
                                    <a key={item.href} href={item.href} className="text-sm text-slate-300 transition hover:text-white">
                                        {item.label}
                                    </a>
                                ))}
                            </nav>

                            <div className="flex items-center gap-3">
                                {isAuthenticated ? (
                                    <>
                                        <Button asChild variant="ghost" className="hidden sm:inline-flex">
                                            <Link href="/assistant">{auth?.user?.name}</Link>
                                        </Button>
                                        <Button asChild>
                                            <Link href="/assistant">{locale === 'ar' ? 'افتح المساعد' : 'Open assistant'}</Link>
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button asChild variant="ghost" className="hidden sm:inline-flex">
                                            <Link href="/login">{locale === 'ar' ? 'تسجيل الدخول' : 'Log in'}</Link>
                                        </Button>
                                        <Button asChild>
                                            <Link href="/register">
                                                {locale === 'ar' ? 'ابدأ الآن' : 'Get started'}
                                                <Sparkles className="size-4" />
                                            </Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </header>

                    <main className="relative z-10">
                        <HeroSection isAuthenticated={isAuthenticated} disable3D={disable3D} />
                        <VoiceVisionShowcase />
                        <FeatureGrid />
                        <HowItWorksTimeline />
                        <TrustSection />
                        <FinalCTA isAuthenticated={isAuthenticated} />
                    </main>

                    <footer className="relative z-10 border-t border-white/10 px-4 py-8 sm:px-6 lg:px-8">
                        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                            <p>{locale === 'ar' ? 'واجهة هبوط مميزة لمنتج تدريب ذكاء اصطناعي موثوق، لا لقالب SaaS عام.' : 'Premium landing system for a credible AI coaching product, not a generic SaaS shell.'}</p>
                            <div className="flex items-center gap-4">
                                <a href="#hero" className="inline-flex items-center gap-2 transition hover:text-white">
                                    {locale === 'ar' ? 'العودة للأعلى' : 'Back to top'}
                                    <ArrowUpLeft className="size-4" />
                                </a>
                                <Link href={isAuthenticated ? '/assistant' : '/login'} className="transition hover:text-white">
                                    {isAuthenticated ? (locale === 'ar' ? 'المساعد' : 'Assistant') : (locale === 'ar' ? 'تسجيل الدخول' : 'Log in')}
                                </Link>
                            </div>
                        </div>
                    </footer>
                </div>
            </MotionConfig>
        </>
    );
}
