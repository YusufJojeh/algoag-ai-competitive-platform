import MotionReveal from '@/components/landing/MotionReveal';
import { Badge } from '@/components/ui/badge';
import { useUiLocale } from '@/lib/ui-locale';

export default function HowItWorksTimeline() {
    const { locale } = useUiLocale();
    const steps = locale === 'ar'
        ? ['شارك المسألة أو الصقها', 'اختر نوع التدريب', 'راجع التلميح أو التعقيد أو الكود']
        : ['Share or paste the problem', 'Choose a coaching mode', 'Review the hint, complexity, or code'];

    return (
        <section className="landing-section-shell px-4 py-12 sm:px-6 lg:px-8 lg:py-16" id="how-it-works">
            <MotionReveal className="mx-auto max-w-7xl">
                <Badge variant="muted">{locale === 'ar' ? 'كيف يعمل' : 'How it works'}</Badge>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {steps.map((step, index) => (
                        <div key={step} className="rounded-[28px] border border-white/10 bg-slate-900/60 p-6 text-white backdrop-blur">
                            <p className="text-xs tracking-[0.22em] text-slate-400">0{index + 1}</p>
                            <p className="mt-3 text-lg font-semibold">{step}</p>
                        </div>
                    ))}
                </div>
            </MotionReveal>
        </section>
    );
}
