import MotionReveal from '@/components/landing/MotionReveal';
import { useUiLocale } from '@/lib/ui-locale';
import { Binary, Braces, Bug, Gauge } from 'lucide-react';

export default function FeatureGrid() {
    const { locale } = useUiLocale();
    const features = locale === 'ar'
        ? [
              { icon: Binary, title: 'قراءة مسائل مسابقات', description: 'يلتقط العنوان، القيود، العينات، وإشارات الأنماط من الشاشة أو النص الملصق.' },
              { icon: Gauge, title: 'تعقيد قبل الكود', description: 'يفصل بين الفكرة، التعقيد، والاختناقات قبل الوصول إلى الحل الكامل.' },
              { icon: Bug, title: 'تصحيح WA والحالات الحدية', description: 'راجع المنطق، اكتشف counterexamples، واطلب حالات تكسر الفرضيات.' },
              { icon: Braces, title: 'توليد وفحص الحلول', description: 'يدعم مسار Codeforces لتوليد C++ أو Python مع شرح واختبارات توضيحية.' },
          ]
        : [
              { icon: Binary, title: 'Contest problem reading', description: 'Captures titles, constraints, samples, and pattern signals from the screen or pasted text.' },
              { icon: Gauge, title: 'Complexity before code', description: 'Separates the idea, complexity, and bottlenecks before jumping to a full solution.' },
              { icon: Bug, title: 'WA debugging and edge cases', description: 'Review logic, find counterexamples, and request cases that break assumptions.' },
              { icon: Braces, title: 'Generate and verify solutions', description: 'Supports the Codeforces flow for C++ or Python generation with explanation and illustrative tests.' },
          ];

    return (
        <section className="landing-section-shell px-4 py-12 sm:px-6 lg:px-8 lg:py-16" id="features">
            <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-4">
                {features.map((feature, index) => (
                    <MotionReveal key={feature.title} delay={index * 0.06} className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
                        <feature.icon className="h-5 w-5 text-cyan-200" />
                        <p className="mt-5 text-sm font-semibold text-white">{feature.title}</p>
                        <p className="mt-3 text-sm leading-6 text-slate-300">{feature.description}</p>
                    </MotionReveal>
                ))}
            </div>
        </section>
    );
}
