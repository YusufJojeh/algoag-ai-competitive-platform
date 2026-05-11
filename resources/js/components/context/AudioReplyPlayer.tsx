import { useMemo, useRef, useState } from 'react';
import { Pause, Play, Volume2 } from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';

type AudioReplyPlayerProps = {
    src?: string | null;
    compact?: boolean;
};

export default function AudioReplyPlayer({ src, compact = false }: AudioReplyPlayerProps) {
    const { locale } = useUiLocale();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playing, setPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [error, setError] = useState(false);

    const progress = useMemo(() => {
        if (!duration) {
            return 0;
        }

        return Math.min((currentTime / duration) * 100, 100);
    }, [currentTime, duration]);

    if (!src) {
        return (
            <div className="rounded-[24px] border border-dashed border-[var(--app-border)] bg-white/65 p-4 text-sm text-[var(--app-muted)]">
                {locale === 'ar' ? 'الرد الصوتي غير جاهز بعد.' : 'The audio reply is not ready yet.'}
            </div>
        );
    }

    const togglePlayback = async () => {
        const element = audioRef.current;
        if (!element) {
            return;
        }

        try {
            if (playing) {
                element.pause();
            } else {
                await element.play();
            }
        } catch {
            setError(true);
        }
    };

    return (
        <div className={`rounded-[24px] border border-[var(--app-border)] bg-white/88 ${compact ? 'p-3' : 'p-4'} shadow-sm`}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-[var(--app-accent-soft)] text-[var(--app-accent-strong)]">
                        <Volume2 className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-[var(--app-foreground)]">{locale === 'ar' ? 'الرد الصوتي' : 'Audio reply'}</p>
                        <p className="text-xs text-[var(--app-muted)]">
                            {error
                                ? (locale === 'ar' ? 'تعذر تشغيل الصوت.' : 'Unable to play audio.')
                                : (locale === 'ar' ? 'يمكنك الاستماع إلى صياغة الرد الحالية.' : 'You can listen to the current spoken reply.')}
                        </p>
                    </div>
                </div>
                <Button type="button" variant="soft" size="sm" onClick={togglePlayback}>
                    {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {playing ? (locale === 'ar' ? 'إيقاف' : 'Pause') : (locale === 'ar' ? 'تشغيل' : 'Play')}
                </Button>
            </div>

            <div className="mt-4 space-y-2">
                <Progress value={progress} />
                <div className="flex items-center justify-between text-xs text-[var(--app-muted)]">
                    <span>{currentTime.toFixed(0)}ث</span>
                    <span>{duration ? `${duration.toFixed(0)}ث` : '...'}</span>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={src}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => {
                    setPlaying(false);
                    setCurrentTime(0);
                }}
                onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                onError={() => setError(true)}
            />
        </div>
    );
}
