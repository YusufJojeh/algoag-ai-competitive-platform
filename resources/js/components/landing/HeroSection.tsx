import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpLeft, AudioLines, Eye, Sparkles, Waves } from 'lucide-react';

import FloatingPanels from '@/components/landing/FloatingPanels';
import MediaPlaceholderFrame from '@/components/landing/MediaPlaceholderFrame';
import MotionReveal from '@/components/landing/MotionReveal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';

const HeroScene3D = lazy(() => import('@/components/landing/HeroScene3D'));

interface HeroSectionProps {
    isAuthenticated: boolean;
    disable3D?: boolean;
}

export default function HeroSection({ isAuthenticated, disable3D = false }: HeroSectionProps) {
    const { locale } = useUiLocale();
    const reduceMotion = useReducedMotion();
    const [canRender3D, setCanRender3D] = useState(false);
    const primaryHref = useMemo(() => (isAuthenticated ? '/assistant' : '/register'), [isAuthenticated]);
    const primaryLabel = isAuthenticated
        ? (locale === 'ar' ? 'افتح المساعد الآن' : 'Open the assistant now')
        : (locale === 'ar' ? 'ابدأ التجربة' : 'Start the experience');
    const secondaryHref = isAuthenticated ? '/assistant' : '/login';
    const secondaryLabel = isAuthenticated
        ? (locale === 'ar' ? 'العودة إلى مساحة العمل' : 'Back to the workspace')
        : (locale === 'ar' ? 'تسجيل الدخول' : 'Log in');
    const stats = locale === 'ar'
        ? [
              { label: 'مدرك للرؤية', value: 'شاشات، نصوص مسائل، وقيود' },
              { label: 'صوتي أصلاً', value: 'تفكير، تردد، ونية' },
              { label: 'لحظي', value: 'بث حالات التدريب وإشارات التوجيه' },
          ]
        : [
              { label: 'Vision-aware', value: 'Screens, statements, constraints' },
              { label: 'Voice-native', value: 'Reasoning, hesitation, intent' },
              { label: 'Realtime', value: 'Streaming status and coaching cues' },
          ];

    useEffect(() => {
        if (reduceMotion || disable3D) {
            setCanRender3D(false);
            return;
        }

        const canvas = document.createElement('canvas');
        const supported =
            typeof window !== 'undefined' &&
            'WebGLRenderingContext' in window &&
            Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));

        setCanRender3D(supported);
    }, [disable3D, reduceMotion]);

    return (
        <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16" id="hero">
            <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative z-10">
                    <MotionReveal className="max-w-3xl">
                        <Badge className="mb-6 w-fit gap-2 rounded-full px-4 py-1.5 text-[11px] tracking-[0.3em]" variant="violet">
                            <Sparkles className="size-3.5" />
                            {locale === 'ar' ? 'مساعد حل المسائل بالصوت والرؤية' : 'AI Problem-Solving Voice + Vision Assistant'}
                        </Badge>
                        <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
                            {locale === 'ar' ? (
                                <>
                                    مساعد يحلل <span className="landing-text-gradient">ما تراه</span> و
                                    <span className="landing-text-gradient-cyan"> ما تقوله</span> قبل أن يوجّهك للحل.
                                </>
                            ) : (
                                <>
                                    An assistant that understands <span className="landing-text-gradient">what you see</span> and
                                    <span className="landing-text-gradient-cyan"> what you say</span> before guiding you to the solution.
                                </>
                            )}
                        </h1>
                        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                            {locale === 'ar'
                                ? 'ليس صندوق دردشة عام. هذه واجهة تدريب سينمائية للمبرمجين ترى نص المسألة على الشاشة، تسمع طريقة تفكيرك بصوتك، وترد بتحليل وتعليق حيّ خطوة بخطوة.'
                                : 'This is not a generic chat box. It is a cinematic coaching surface for programmers that sees the problem on screen, hears your reasoning, and responds with live step-by-step analysis.'}
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
                                {locale === 'ar' ? 'كيف يعمل' : 'How it works'}
                                <ArrowUpLeft className="transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5" />
                            </a>
                        </Button>
                    </MotionReveal>

                    <MotionReveal delay={0.18} className="mt-10 grid gap-3 sm:grid-cols-3">
                        {stats.map((item) => (
                            <div key={item.label} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                                <p className="mt-2 text-sm leading-6 text-slate-200">{item.value}</p>
                            </div>
                        ))}
                    </MotionReveal>

                    <MotionReveal delay={0.26} className="mt-10 grid gap-4 md:grid-cols-3">
                        <div className="rounded-[28px] border border-cyan-300/18 bg-cyan-400/8 p-5">
                            <Eye className="size-5 text-cyan-200" />
                            <p className="mt-4 text-sm font-medium text-white">{locale === 'ar' ? 'AI يرى السياق فعلاً' : 'AI truly sees the context'}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                {locale === 'ar'
                                    ? 'واجهة مبنية على مشاركة الشاشة والتقاط الإطار، لا على سؤال نصي منزوع من تفاصيله.'
                                    : 'The product is built on screen sharing and frame capture, not on stripped-down text prompts.'}
                            </p>
                        </div>
                        <div className="rounded-[28px] border border-violet-300/18 bg-violet-400/8 p-5">
                            <AudioLines className="size-5 text-violet-100" />
                            <p className="mt-4 text-sm font-medium text-white">{locale === 'ar' ? 'AI يسمع أسلوب التفكير' : 'AI hears how you reason'}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                {locale === 'ar'
                                    ? 'يدعم الإدخال الصوتي والنصي حتى يفسر التردد، الفرضيات، ومسار المحاولة.'
                                    : 'Voice and text input help it interpret hesitation, hypotheses, and the path of the attempt.'}
                            </p>
                        </div>
                        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                            <Waves className="size-5 text-slate-100" />
                            <p className="mt-4 text-sm font-medium text-white">{locale === 'ar' ? 'تحليل مباشر مع تغذية راجعة' : 'Live analysis with feedback'}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                {locale === 'ar'
                                    ? 'يحوّل الالتقاط والصوت إلى مسار شرح حيّ مع حالة تحليل واضحة للمستخدم.'
                                    : 'It turns capture and voice into a live explanation flow with clear analysis status.'}
                            </p>
                        </div>
                    </MotionReveal>
                </div>

                <MotionReveal delay={0.12} className="relative lg:min-h-[760px]">
                    <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_30px_120px_rgba(2,6,23,0.75)] backdrop-blur-xl sm:p-5">
                        <div className="relative aspect-[0.98] overflow-hidden rounded-[30px] border border-white/10 bg-slate-950">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.18),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.24),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,1))]" />
                            {canRender3D ? (
                                <Suspense
                                    fallback={
                                        <div className="absolute inset-0">
                                            <MediaPlaceholderFrame
                                                slot="Hero fallback"
                                                title="3D fallback frame"
                                                description="Static premium composition when reduced motion or WebGL fallback is active."
                                                type="motion"
                                                accent="cyan"
                                                className="h-full rounded-none border-0 bg-transparent shadow-none"
                                            />
                                        </div>
                                    }
                                >
                                    <HeroScene3D />
                                </Suspense>
                            ) : (
                                <div className="absolute inset-0">
                                    <MediaPlaceholderFrame
                                        slot="Hero fallback"
                                        title="3D fallback frame"
                                        description="Static premium composition when reduced motion is preferred or WebGL is unavailable."
                                        type="motion"
                                        accent="cyan"
                                        className="h-full rounded-none border-0 bg-transparent shadow-none"
                                    />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_34%,rgba(2,6,23,0.72)_100%)]" />
                            <FloatingPanels />
                            <motion.div
                                animate={reduceMotion ? { opacity: 1 } : { opacity: [0.55, 0.9, 0.55], scale: [0.96, 1, 0.96] }}
                                transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                                className="absolute inset-x-12 top-12 h-32 rounded-full bg-violet-500/14 blur-3xl"
                            />
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
                            <MediaPlaceholderFrame
                                slot="Media slot 01"
                                title="Vision capture hero still"
                                description="لقطة واجهة توضّح كيف يقرأ المنتج نص المسألة والمخططات والتعليمات من الشاشة."
                                type="vision"
                                accent="violet"
                                chips={['Problem screenshot', 'Constraint highlights', 'Arabic-first UI']}
                            />
                            <MediaPlaceholderFrame
                                slot="Media slot 02"
                                title="Voice waveform motion plate"
                                description="لوحة صوتية جاهزة لفيديو قصير أو موشن لعرض الاستماع للتفكير المنطوق في الزمن الحقيقي."
                                type="voice"
                                accent="cyan"
                                chips={['Waveform loop', 'Transcript overlay', 'Realtime cues']}
                            />
                        </div>
                    </div>
                </MotionReveal>
            </div>
        </section>
    );
}
