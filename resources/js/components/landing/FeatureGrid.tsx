import MotionReveal from '@/components/landing/MotionReveal';
import { useUiLocale } from '@/lib/ui-locale';

export default function FeatureGrid() {
    const { locale } = useUiLocale();
    const features = locale === 'ar'
        ? [
              'التقاط إطار ثابت ومراجعة سياق المسألة',
              'دعم العربية والإنجليزية في واجهات الاختبار',
              'حالات تشغيل واضحة: جاهز، تحليل، بث، فشل، مكتمل',
          ]
        : [
              'Stable frame capture and problem-context review',
              'Arabic and English runtime UI coverage',
              'Clear runtime states: ready, analyzing, streaming, failed, completed',
          ];

    return (
        <section className="landing-section-shell px-4 py-12 sm:px-6 lg:px-8 lg:py-16" id="features">
            <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
                {features.map((feature, index) => (
                    <MotionReveal key={feature} delay={index * 0.06} className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
                        <p className="text-sm font-semibold text-white">{feature}</p>
                    </MotionReveal>
                ))}
            </div>
        </section>
    );
}
