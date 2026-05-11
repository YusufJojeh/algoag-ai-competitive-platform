const STATUS_MAP = {
    idle: { label: 'جاهز', color: 'text-slate-400', bg: 'bg-slate-700', pulse: false },
    queued: { label: 'في الانتظار...', color: 'text-sky-300', bg: 'bg-sky-600/20', pulse: true },
    transcribing: { label: 'تحويل الصوت...', color: 'text-violet-300', bg: 'bg-violet-600/20', pulse: true },
    analyzing: { label: 'جاري التحليل...', color: 'text-amber-300', bg: 'bg-amber-600/20', pulse: true },
    streaming: { label: 'يتم الرد...', color: 'text-emerald-300', bg: 'bg-emerald-600/20', pulse: true },
    tts_generating: { label: 'توليد الصوت...', color: 'text-cyan-300', bg: 'bg-cyan-600/20', pulse: true },
    completed: { label: 'مكتمل', color: 'text-emerald-400', bg: 'bg-emerald-600/20', pulse: false },
    failed: { label: 'فشل', color: 'text-red-400', bg: 'bg-red-600/20', pulse: false },
    cancelled: { label: 'ملغي', color: 'text-slate-400', bg: 'bg-slate-700', pulse: false },
};

export default function StatusIndicator({ status = 'idle' }) {
    const info = STATUS_MAP[status] || STATUS_MAP.idle;

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${info.bg} ${info.color}`}>
            {info.pulse && (
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            )}
            {info.label}
        </div>
    );
}

export { STATUS_MAP };
