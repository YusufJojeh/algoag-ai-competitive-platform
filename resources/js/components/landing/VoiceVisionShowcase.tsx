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
                    {locale === 'ar' ? 'عرض حي يجمع الرؤية والصوت في جلسة تدريب واحدة.' : 'A live surface that blends vision and voice into one coaching session.'}
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                    {locale === 'ar'
                        ? 'المساعد لا يرى نصاً فقط. هو يقرأ ما على الشاشة، يلتقط كيف تشرح فكرتك، ثم يبني استجابة تعليمية واضحة ومتصلة.'
                        : 'The assistant does not consume text alone. It reads what is on screen, captures how you explain the idea, then builds a clear connected teaching response.'}
                </p>
            </MotionReveal>
        </section>
    );
}
