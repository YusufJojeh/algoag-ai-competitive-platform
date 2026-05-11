import { useRef, useState } from 'react';

export default function AudioPlayer({ src }) {
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [audioError, setAudioError] = useState(false);

    if (!src) return null;

    const toggle = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (playing) {
            audio.pause();
        } else {
            audio.play().catch(() => setAudioError(true));
        }
    };

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={toggle}
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition"
            >
                {playing ? '⏸ إيقاف' : '▶ تشغيل الرد'}
            </button>
            {audioError && (
                <span className="text-red-400 text-xs">فشل تشغيل الصوت</span>
            )}
            <audio
                ref={audioRef}
                src={src}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onError={() => setAudioError(true)}
            />
        </div>
    );
}
