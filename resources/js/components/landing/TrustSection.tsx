import MotionReveal from '@/components/landing/MotionReveal';
import { Badge } from '@/components/ui/badge';
import { useUiLocale } from '@/lib/ui-locale';

export default function TrustSection() {
    const { locale } = useUiLocale();

    const points = locale === 'ar'
        ? [
              { title: 'الحكم المحلي فقط', body: 'الكود يُشغَّل على جهازك عبر Python أو g++. هذا مناسب للتعلم والعرض الأكاديمي. الإنتاج الحقيقي يحتاج Sandbox مثل Docker أو gVisor لعزل الكود قبل التشغيل.' },
              { title: 'الاختبارات المخفية آمنة', body: 'المسائل تحتوي اختبارات عامة تُعرض، وأخرى مخفية لا يُكشف محتواها أبداً لأي مستخدم عادي. البنية مصممة لمنع التسريب.' },
              { title: 'ثنائي اللغة بالكامل', body: 'الواجهة بالكامل بالعربية والإنجليزية. المحتوى يحترم اتجاه القراءة RTL للعربية في كل صفحة.' },
          ]
        : [
              { title: 'Local judging only', body: 'Code runs on your machine via Python or g++. Suitable for learning and academic demos. Production use requires a sandbox like Docker or gVisor to safely isolate user code before execution.' },
              { title: 'Hidden tests are safe', body: 'Problems have public sample cases that are shown, and private hidden cases whose content is never exposed to regular users. The architecture prevents leakage.' },
              { title: 'Fully bilingual', body: 'The entire interface is in Arabic and English. Content respects RTL layout for Arabic across every page.' },
          ];

    return (
        <section className="landing-section-shell px-4 py-12 sm:px-6 lg:px-8 lg:py-16" id="trust">
            <MotionReveal className="mx-auto max-w-7xl rounded-[36px] border border-white/10 bg-slate-900/55 p-8 backdrop-blur-xl">
                <Badge variant="muted">{locale === 'ar' ? 'صراحة وأمان' : 'Honesty & safety'}</Badge>
                <h2 className="mt-5 text-3xl font-semibold text-white">
                    {locale === 'ar'
                        ? 'صريح حول حدوده. مصمم بحيث ما يُخفى يبقى مخفياً.'
                        : 'Honest about its limits. Designed so what is hidden stays hidden.'}
                </h2>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    {points.map((p) => (
                        <div key={p.title} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                            <p className="text-sm font-semibold text-white">{p.title}</p>
                            <p className="mt-3 text-sm leading-6 text-slate-300">{p.body}</p>
                        </div>
                    ))}
                </div>
            </MotionReveal>
        </section>
    );
}
