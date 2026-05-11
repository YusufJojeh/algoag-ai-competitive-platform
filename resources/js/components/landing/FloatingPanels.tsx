import { useUiLocale } from '@/lib/ui-locale';

const copy = {
    ar: {
        top: 'بث التحليل اللحظي',
        middle: 'فهم الشاشة + النص + الصوت',
        bottom: 'تعليقات تعليمية قصيرة',
    },
    en: {
        top: 'Realtime analysis stream',
        middle: 'Screen + transcript + voice understanding',
        bottom: 'Short teaching feedback',
    },
} as const;

export default function FloatingPanels() {
    const { locale } = useUiLocale();
    const text = copy[locale];

    return (
        <>
            <div className="absolute left-6 top-6 rounded-[24px] border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-2xl backdrop-blur">
                {text.top}
            </div>
            <div className="absolute bottom-8 left-8 rounded-[24px] border border-violet-300/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100 shadow-2xl backdrop-blur">
                {text.middle}
            </div>
            <div className="absolute bottom-8 right-8 rounded-[24px] border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100 shadow-2xl backdrop-blur">
                {text.bottom}
            </div>
        </>
    );
}
