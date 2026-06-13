import { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpLeft, AudioLines, Eye, Sparkles, Waves } from 'lucide-react';

import FloatingPanels from '@/components/landing/FloatingPanels';
import MediaPlaceholderFrame from '@/components/landing/MediaPlaceholderFrame';
import MotionReveal from '@/components/landing/MotionReveal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';

interface HeroSectionProps {
    isAuthenticated: boolean;
    disable3D?: boolean;
}

export default function HeroSection({ isAuthenticated, disable3D = false }: HeroSectionProps) {
    const { locale } = useUiLocale();
    const reduceMotion = useReducedMotion();
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
              { label: 'يفهم المسألة', value: 'نصوص، قيود، عينات، وأكواد' },
              { label: 'يدرب لا يلقّن', value: 'تلميحات، تعقيد، وحالات حدية' },
              { label: 'جلسة حية', value: 'صوت، رؤية، وبث حالة التحليل' },
          ]
        : [
              { label: 'Problem-aware', value: 'Statements, constraints, samples, code' },
              { label: 'Coaches first', value: 'Hints, complexity, edge cases' },
              { label: 'Live session', value: 'Voice, vision, and analysis status' },
          ];

    return (
        <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16" id="hero">
            <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative z-10">
                    <MotionReveal className="max-w-3xl">
                        <Badge className="mb-6 w-fit gap-2 rounded-full px-4 py-1.5 text-[11px] tracking-[0.3em]" variant="violet">
                            <Sparkles className="size-3.5" />
                            {locale === 'ar' ? 'مدرب مسابقات برمجية بالصوت والرؤية' : 'Competitive Programming Voice + Vision Coach'}
                        </Badge>
                        <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
                            {locale === 'ar' ? (
                                <>
                                    مدرب يفهم <span className="landing-text-gradient">نص المسألة</span> و
                                    <span className="landing-text-gradient-cyan"> طريقة تفكيرك</span> قبل أن يكشف الحل.
                                </>
                            ) : (
                                <>
                                    A coach that understands <span className="landing-text-gradient">the problem statement</span> and
                                    <span className="landing-text-gradient-cyan"> your reasoning</span> before revealing the path.
                                </>
                            )}
                        </h1>
                        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                            {locale === 'ar'
                                ? 'ALGOAG يحوّل شاشة المسألة، صوتك، ومحاولتك الحالية إلى تدريب عملي: تلميح عند الحاجة، نقد للمنطق، كشف للحالات الحدية، وفحص للتعقيد قبل الحل الكامل.'
                                : 'ALGOAG turns the problem screen, your voice, and your current attempt into practical coaching: hints when needed, logic critique, edge cases, and complexity checks before the full solution.'}
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
                                <ArrowUpLeft className="flip-rtl transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5" />
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
                            <p className="mt-4 text-sm font-medium text-white">{locale === 'ar' ? 'يفهم نص المسألة والسياق' : 'Understands the statement and context'}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                {locale === 'ar'
                                    ? 'مشاركة الشاشة والتقاط الإطار يحفظان القيود، الأمثلة، والمحرر بدلاً من عزل السؤال عن تفاصيله.'
                                    : 'Screen sharing and frame capture preserve constraints, examples, and editor state instead of stripping the question down.'}
                            </p>
                        </div>
                        <div className="rounded-[28px] border border-violet-300/18 bg-violet-400/8 p-5">
                            <AudioLines className="size-5 text-violet-100" />
                            <p className="mt-4 text-sm font-medium text-white">{locale === 'ar' ? 'يسمع مسار التفكير' : 'Hears the reasoning path'}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                {locale === 'ar'
                                    ? 'اكتب أو تحدث عن فكرتك، ثم اطلب تلميحاً، مقارنة مقاربات، أو مراجعة كود دون تبديل الأدوات.'
                                    : 'Type or speak your idea, then ask for a hint, approach comparison, or code review without switching tools.'}
                            </p>
                        </div>
                        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                            <Waves className="size-5 text-slate-100" />
                            <p className="mt-4 text-sm font-medium text-white">{locale === 'ar' ? 'تدريب مباشر قابل للتتبع' : 'Trackable live coaching'}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                {locale === 'ar'
                                    ? 'حالات جاهز، تحليل، صوت، فشل، واكتمال تجعل دورة التدريب مفهومة حتى عند تأخر نموذج الذكاء الاصطناعي.'
                                    : 'Ready, analyzing, audio, failed, and completed states keep the coaching loop understandable even when the AI model takes time.'}
                            </p>
                        </div>
                    </MotionReveal>
                </div>

                <MotionReveal delay={0.12} className="relative lg:min-h-[760px]" data-static-hero={disable3D ? 'true' : 'false'}>
                    <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_30px_120px_rgba(2,6,23,0.75)] backdrop-blur-xl sm:p-5">
                        <div className="relative aspect-[0.98] overflow-hidden rounded-[30px] border border-white/10 bg-slate-950">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.18),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.24),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,1))]" />
                            <img
                                src="/images/algoag-hero-ai-coach.svg"
                                alt={locale === 'ar' ? 'لوحة بطل تجريدية لمساعد ALGOAG بالصوت والرؤية' : 'Abstract ALGOAG voice and vision AI coach hero artwork'}
                                className="absolute inset-0 h-full w-full scale-[1.02] object-cover opacity-95"
                                loading="eager"
                                decoding="async"
                            />
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
