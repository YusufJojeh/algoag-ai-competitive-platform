import MotionReveal from '@/components/landing/MotionReveal';
import { Badge } from '@/components/ui/badge';
import { useUiLocale } from '@/lib/ui-locale';

export default function ArenaOverview() {
    const { locale } = useUiLocale();

    return (
        <section className="landing-section-shell px-4 py-12 sm:px-6 lg:px-8 lg:py-16" id="experience">
            <MotionReveal className="mx-auto max-w-7xl rounded-[36px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
                <Badge variant="muted">{locale === 'ar' ? 'المنصة' : 'The platform'}</Badge>
                <h2 className="mt-5 text-3xl font-semibold text-white">
                    {locale === 'ar'
                        ? 'ساحة تدريب متكاملة: مسائل، مسابقات، حكم، وAI في مكان واحد.'
                        : 'One training surface: problems, contests, local judging, and AI coaching together.'}
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                    {locale === 'ar'
                        ? 'اختر مسألة من بنك المسائل أو انضم لمسابقة. أرسل حلك بـ Python أو C++. شاهد النتيجة الفورية. اسأل المساعد عن الفكرة، التعقيد، أو الحالات الحدية. كل هذا بواجهة واحدة بدون تبديل أدوات.'
                        : 'Pick a problem from the bank or join a contest. Submit your Python or C++ solution. See the verdict immediately. Ask the AI coach about the approach, complexity, or edge cases. All in one interface, no tool switching.'}
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    {(locale === 'ar'
                        ? [
                              { label: '01', title: 'اختر مسألة أو انضم لمسابقة', body: 'تصفح المسائل حسب الصعوبة والوسوم، أو ادخل مسابقة تدريبية أو مؤقتة.' },
                              { label: '02', title: 'أرسل Python أو C++', body: 'اكتب حلك وأرسله. الحكم المحلي يشغّل الكود على اختبارات حقيقية ويعطيك النتيجة فوراً.' },
                              { label: '03', title: 'استخدم AI لتحسين فكرتك', body: 'اطلب تلميحاً، اشرح طريقة تفكيرك، أو اكتشف الحالات الحدية قبل الإرسال التالي.' },
                          ]
                        : [
                              { label: '01', title: 'Pick a problem or join a contest', body: 'Browse problems by difficulty and tags, or enter a timed or practice contest.' },
                              { label: '02', title: 'Submit Python or C++', body: 'Write your solution and submit it. The local judge runs your code against real test cases and returns a verdict instantly.' },
                              { label: '03', title: 'Use the AI coach to improve', body: 'Ask for a hint, explain your reasoning, or surface edge cases before your next attempt.' },
                          ]
                    ).map((step) => (
                        <div key={step.label} className="rounded-[28px] border border-white/10 bg-slate-900/60 p-6 backdrop-blur">
                            <p className="text-xs tracking-[0.22em] text-slate-400">{step.label}</p>
                            <p className="mt-3 text-base font-semibold text-white">{step.title}</p>
                            <p className="mt-3 text-sm leading-6 text-slate-300">{step.body}</p>
                        </div>
                    ))}
                </div>
            </MotionReveal>
        </section>
    );
}
