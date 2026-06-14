import MotionReveal from '@/components/landing/MotionReveal';
import { Badge } from '@/components/ui/badge';
import { useUiLocale } from '@/lib/ui-locale';

export default function HowItWorksTimeline() {
    const { locale } = useUiLocale();
    const steps = locale === 'ar'
        ? [
              { n: '01', title: 'سجّل وانضم', body: 'أنشئ حساباً، اختر أهدافك ومستواك خلال دقيقة، ثم ابدأ مباشرة.' },
              { n: '02', title: 'حل مسائل أو ادخل مسابقة', body: 'تصفح المسائل حسب الصعوبة أو الانضمام لمسابقة تدريبية أو مؤقتة مع ترتيب حي.' },
              { n: '03', title: 'أرسل Python أو C++', body: 'اكتب الحل واضغط إرسال. الحكم المحلي يشغّل الكود ويعطيك نتيجة فورية على كل اختبار.' },
              { n: '04', title: 'اسأل AI واحسّن فكرتك', body: 'بعد كل إرسال اطلب تلميحاً، مقارنة مقاربات، أو تحليل TLE من المساعد الذكي.' },
          ]
        : [
              { n: '01', title: 'Register and onboard', body: 'Create an account, set your goal and level in under a minute, then start immediately.' },
              { n: '02', title: 'Solve problems or join a contest', body: 'Browse problems by difficulty or enter a practice or timed contest with live standings.' },
              { n: '03', title: 'Submit Python or C++', body: 'Write your solution and submit. The local judge runs your code and returns an instant verdict per test case.' },
              { n: '04', title: 'Ask the AI and improve', body: 'After each verdict, ask for a hint, compare approaches, or get a TLE analysis from the AI coach.' },
          ];

    return (
        <section className="landing-section-shell px-4 py-12 sm:px-6 lg:px-8 lg:py-16" id="how-it-works">
            <MotionReveal className="mx-auto max-w-7xl">
                <Badge variant="muted">{locale === 'ar' ? 'كيف يعمل' : 'How it works'}</Badge>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {steps.map((step) => (
                        <div key={step.n} className="rounded-[28px] border border-white/10 bg-slate-900/60 p-6 text-white backdrop-blur">
                            <p className="text-xs tracking-[0.22em] text-slate-400">{step.n}</p>
                            <p className="mt-3 text-lg font-semibold">{step.title}</p>
                            <p className="mt-3 text-sm leading-6 text-slate-300">{step.body}</p>
                        </div>
                    ))}
                </div>
            </MotionReveal>
        </section>
    );
}
