export default function VoiceControls({
    isRecording,
    transcript,
    error,
    isSupported,
    isFallbackMode,
    language,
    onLanguageChange,
    onTranscriptChange,
    onStart,
    onStop,
}) {
    return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-slate-300 text-sm font-medium">الإدخال الصوتي / النصي</h3>
                <div className="flex items-center gap-2">
                    <select
                        value={language}
                        onChange={(e) => onLanguageChange(e.target.value)}
                        className="bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-xs px-2 py-1.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                        <option value="ar-SA">العربية</option>
                        <option value="en-US">English</option>
                    </select>

                    {isSupported && (
                        <button
                            type="button"
                            onClick={isRecording ? onStop : onStart}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                isRecording
                                    ? 'bg-red-600 hover:bg-red-500 text-white'
                                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                            }`}
                        >
                            {isRecording ? (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    إيقاف
                                </>
                            ) : (
                                <>🎤 تسجيل</>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {isFallbackMode && !error && (
                <p className="text-amber-300/70 text-xs">
                    متصفحك لا يدعم التعرف المباشر على الكلام — سيتم إرسال الصوت للخادم للتحويل
                </p>
            )}

            {error && (
                <p className="text-red-400 text-xs">{error}</p>
            )}

            <textarea
                value={transcript}
                onChange={(e) => onTranscriptChange(e.target.value)}
                placeholder="اكتب فكرتك هنا أو استخدم الميكروفون..."
                rows={3}
                maxLength={5000}
                className="w-full rounded-lg bg-slate-800/80 border border-slate-600 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 px-3 py-2 text-sm resize-none"
            />
        </div>
    );
}
