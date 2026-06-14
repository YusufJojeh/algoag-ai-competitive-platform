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
                    {locale === 'ar'
                        ? 'ابدأ صح: حل مسألة، أرسل الكود، شاهد الحكم، ثم ادخل أول مسابقة تدريبية.'
                        : 'Start clean: solve one problem, submit your code, review the verdict, then join your first practice arena.'}
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">
                    {locale === 'ar'
                        ? 'الحكم المحلي يعمل فوراً. المسابقات التدريبية مفتوحة دائماً. المساعد جاهز للشرح في أي وقت.'
                        : 'Local judging works immediately. Practice contests are always open. The AI coach is ready to explain at any time.'}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild size="lg">
                        <Link href={isAuthenticated ? '/problems' : '/register'}>
                            {isAuthenticated
                                ? (locale === 'ar' ? 'حل مسألة' : 'Solve a problem')
                                : (locale === 'ar' ? 'ابدأ التدريب' : 'Start Training')}
                        </Link>
                    </Button>
                    <Button asChild variant="secondary" size="lg">
                        <Link href="/arena">
                            {locale === 'ar' ? 'ادخل الساحة' : 'Enter Arena'}
                        </Link>
                    </Button>
                    {isAuthenticated && (
                        <Button asChild variant="ghost" size="lg">
                            <Link href="/assistant">
                                {locale === 'ar' ? 'اسأل مساعد AI' : 'Ask AI Assistant'}
                            </Link>
                        </Button>
                    )}
                </div>
            </MotionReveal>
        </section>
    );
}
