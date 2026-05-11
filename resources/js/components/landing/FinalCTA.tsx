import { Link } from '@inertiajs/react';

import MotionReveal from '@/components/landing/MotionReveal';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';

type FinalCTAProps = {
    isAuthenticated: boolean;
};

export default function FinalCTA({ isAuthenticated }: FinalCTAProps) {
    const { locale } = useUiLocale();

    return (
        <section className="landing-section-shell px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24" id="cta">
            <MotionReveal className="mx-auto max-w-7xl rounded-[38px] border border-white/10 bg-[linear-gradient(135deg,rgba(139,92,246,0.18),rgba(34,211,238,0.14))] p-8 text-white backdrop-blur-xl">
                <h2 className="text-3xl font-semibold">
                    {locale === 'ar' ? 'ابدأ من لقطة شاشة وفكرة قصيرة، وليس من فراغ.' : 'Start from a real screen and a short idea, not from thin air.'}
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">
                    {locale === 'ar'
                        ? 'هذه الواجهة مبنية لتجارب تعليمية موثوقة: مشاركة صريحة، تحليل متدرج، واستجابة قابلة للمراجعة والاختبار.'
                        : 'This interface is built for credible learning sessions: explicit sharing, guided analysis, and responses that can be reviewed and tested.'}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild size="lg">
                        <Link href={isAuthenticated ? '/assistant' : '/register'}>
                            {isAuthenticated
                                ? (locale === 'ar' ? 'اذهب إلى المساعد' : 'Go to assistant')
                                : (locale === 'ar' ? 'أنشئ حساباً' : 'Create account')}
                        </Link>
                    </Button>
                    <Button asChild variant="secondary" size="lg">
                        <Link href={isAuthenticated ? '/assistant' : '/login'}>
                            {isAuthenticated
                                ? (locale === 'ar' ? 'المساعد' : 'Assistant')
                                : (locale === 'ar' ? 'تسجيل الدخول' : 'Log in')}
                        </Link>
                    </Button>
                </div>
            </MotionReveal>
        </section>
    );
}
