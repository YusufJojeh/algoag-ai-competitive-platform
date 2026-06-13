import MotionReveal from '@/components/landing/MotionReveal';
import { Badge } from '@/components/ui/badge';
import { useUiLocale } from '@/lib/ui-locale';

export default function VoiceVisionShowcase() {
    const { locale } = useUiLocale();

    return (
        <section className="landing-section-shell px-4 py-12 sm:px-6 lg:px-8 lg:py-16" id="experience">
            <MotionReveal className="mx-auto max-w-7xl rounded-[36px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
                <Badge variant="muted">{locale === 'ar' ? 'التجربة' : 'Experience'}</Badge>
                <h2 className="mt-5 text-3xl font-semibold text-white">
                    {locale === 'ar' ? 'جلسة تدريب واحدة تفهم المسألة، الصوت، والكود.' : 'One coaching session for the statement, voice, and code.'}
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                    {locale === 'ar'
                        ? 'استخدمه عندما تتعثر في نمط المسألة، عندما تشك في التعقيد، أو عندما تريد مراجعة كود قبل الإرسال. الواجهة تجمع الصورة، النص، الصوت، والأحداث التشغيلية في مساحة واحدة.'
                        : 'Use it when you are stuck on the pattern, unsure about complexity, or want a code review before submitting. The interface keeps image, text, voice, and runtime events in one workspace.'}
                </p>
            </MotionReveal>
        </section>
    );
}
