const MODES = [
    { id: 'hint', label: 'تلميح فقط', icon: '💡' },
    { id: 'check', label: 'تحقق من فكرتي', icon: '✅' },
    { id: 'wrong', label: 'لماذا خاطئ؟', icon: '❌' },
    { id: 'full', label: 'الحل الكامل', icon: '📝' },
    { id: 'summarize', label: 'الخطوة التالية', icon: '➡️' },
    { id: 'edge_cases', label: 'حالات حدية', icon: '⚠️' },
    { id: 'complexity', label: 'تعقيد زمني/ذاكرة', icon: '📊' },
];

export default function QuickActions({ selectedMode, onModeChange, disabled }) {
    return (
        <div className="flex flex-wrap gap-2">
            {MODES.map((mode) => (
                <button
                    key={mode.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onModeChange(mode.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition border ${
                        selectedMode === mode.id
                            ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-200'
                            : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                    <span className="ml-1">{mode.icon}</span>
                    {mode.label}
                </button>
            ))}
        </div>
    );
}

export { MODES };
