import { useRef, useEffect } from 'react';

export default function ScreenPreview({ isSharing, stream, error, isSupported, onStart, onStop, onCapture }) {
    const videoElRef = useRef(null);

    useEffect(() => {
        const video = videoElRef.current;
        if (!video) return;
        if (isSharing && stream) {
            video.srcObject = stream;
            video.play().catch(() => {});
        } else {
            video.srcObject = null;
        }
    }, [isSharing, stream]);

    if (!isSupported) {
        return (
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6 text-center">
                <p className="text-amber-300 text-sm">متصفحك لا يدعم مشاركة الشاشة</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden">
            <div className="relative aspect-video bg-slate-950 flex items-center justify-center">
                {isSharing ? (
                    <video
                        ref={videoElRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div className="text-center px-4">
                        <div className="text-4xl mb-3 opacity-40">🖥️</div>
                        <p className="text-slate-500 text-sm">شارك شاشتك لالتقاط المسألة</p>
                    </div>
                )}

                {isSharing && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-600/80 backdrop-blur px-2.5 py-1 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="text-white text-xs font-medium">مشاركة نشطة</span>
                    </div>
                )}
            </div>

            {error && (
                <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
                    <p className="text-red-400 text-xs">{error}</p>
                </div>
            )}

            <div className="flex items-center gap-2 p-3 border-t border-slate-700/50">
                {!isSharing ? (
                    <button
                        type="button"
                        onClick={onStart}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition"
                    >
                        مشاركة الشاشة
                    </button>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={onCapture}
                            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition"
                        >
                            التقاط إطار
                        </button>
                        <button
                            type="button"
                            onClick={onStop}
                            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition"
                        >
                            إيقاف المشاركة
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
