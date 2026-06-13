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
                    {locale === 'ar' ? 'صريح حول ما يفعله الآن، ومصمم لحالات الخطأ الحقيقية.' : 'Honest about what works today, designed for real failure states.'}
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                    {locale === 'ar'
                        ? 'يعرض بوضوح متى يكون الحكم تجريبياً، متى ينتظر النموذج، ومتى ينتقل إلى الاستطلاع الاحتياطي، مع دعم كامل للعربية والإنجليزية.'
                        : 'It clearly shows when judging is stubbed, when the model is still working, and when polling fallback takes over, with full Arabic and English UI support.'}
                </p>
            </MotionReveal>
        </section>
    );
}
