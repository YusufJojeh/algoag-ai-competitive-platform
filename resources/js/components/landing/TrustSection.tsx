import MotionReveal from '@/components/landing/MotionReveal';
import { Badge } from '@/components/ui/badge';
import { useUiLocale } from '@/lib/ui-locale';

export default function TrustSection() {
    const { locale } = useUiLocale();

    return (
        <section className="landing-section-shell px-4 py-12 sm:px-6 lg:px-8 lg:py-16" id="trust">
            <MotionReveal className="mx-auto max-w-7xl rounded-[36px] border border-white/10 bg-slate-900/55 p-8 backdrop-blur-xl">
                <Badge variant="muted">{locale === 'ar' ? 'الثقة' : 'Trust'}</Badge>
                <h2 className="mt-5 text-3xl font-semibold text-white">
                    {locale === 'ar' ? 'تجربة هادئة، قابلة للاختبار، ومناسبة للعروض الجادة.' : 'A calm, testable experience ready for serious demos.'}
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                    {locale === 'ar'
                        ? 'تم تصميم الواجهة لتتحمل الاختبارات البصرية، اختلاف الاتجاه، وحالات الخطأ بدون فقدان الهوية البصرية.'
                        : 'The interface is designed to survive visual regression checks, direction changes, and failure states without losing product identity.'}
                </p>
            </MotionReveal>
        </section>
    );
}
