import MotionReveal from '@/components/landing/MotionReveal';
import { useUiLocale } from '@/lib/ui-locale';
import { BrainCircuit, Code2, FlaskConical, Lock, Shield, Trophy } from 'lucide-react';

export default function FeatureGrid() {
    const { locale } = useUiLocale();
    const features = locale === 'ar'
        ? [
              { icon: Code2, title: 'مسائل حقيقية، مش CRUD ممل', description: 'مسائل خوارزمية بقيود حقيقية، وسوم، ومستويات. ليست مجرد تمارين بسيطة.' },
              { icon: FlaskConical, title: 'حكم محلي لحلول Python و C++', description: 'أرسل كودك واحصل على نتيجة فورية: قبول، إجابة خاطئة، TLE، أو خطأ ترجمة — بدون خادم خارجي.' },
              { icon: Trophy, title: 'مسابقات تدريبية بنظام انضمام وترتيب', description: 'مسابقات مؤقتة وتدريبية. انضم، أرسل، وتابع الترتيب ICPC مع حساب penalty.' },
              { icon: BrainCircuit, title: 'مساعد AI يشرح التفكير الخوارزمي', description: 'تلميح، مقارنة مقاربات، تصحيح WA، تقييم تعقيد — مساعد يدرّب لا يلقّن.' },
              { icon: Shield, title: 'لوحة Admin لإدارة المسائل والاختبارات', description: 'أنشئ مسائل، أضف اختبارات عامة ومخفية، وارتبطها بمسابقات من لوحة تحكم مخصصة.' },
              { icon: Lock, title: 'اختبارات مخفية بدون تسريب', description: 'المسائل تحتوي اختبارات عامة وأخرى مخفية. لا يُكشف إدخال أو مخرج الاختبارات المخفية للمستخدمين أبداً.' },
          ]
        : [
              { icon: Code2, title: 'Real algorithm practice', description: 'Algorithm problems with real constraints, tags, and difficulty levels — not trivial CRUD exercises.' },
              { icon: FlaskConical, title: 'Local Python/C++ judging', description: 'Submit your solution and get an instant verdict: Accepted, Wrong Answer, TLE, or CE — no external judge server.' },
              { icon: Trophy, title: 'Mini contest arena', description: 'Timed and practice contests. Join, submit within the window, and follow ICPC-style standings with penalty scoring.' },
              { icon: BrainCircuit, title: 'AI-assisted problem solving', description: 'Hints, approach comparison, WA debugging, complexity evaluation — a coach that trains, not just answers.' },
              { icon: Shield, title: 'Admin test-case management', description: 'Create problems, add sample and hidden test cases, and attach them to contests from a dedicated admin panel.' },
              { icon: Lock, title: 'Hidden tests stay hidden', description: 'Problems have public sample cases and private hidden cases. Hidden test I/O is never exposed to regular users.' },
          ];

    return (
        <section className="landing-section-shell px-4 py-12 sm:px-6 lg:px-8 lg:py-16" id="features">
            <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-3">
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
