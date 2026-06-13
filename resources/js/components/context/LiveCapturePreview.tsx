import { useEffect, useMemo, useRef } from 'react';
import { MonitorUp } from 'lucide-react';

import EmptyState from '@/components/shared/EmptyState';
import LoadingState from '@/components/shared/LoadingState';
import { Badge } from '@/components/ui/badge';
import { useUiLocale } from '@/lib/ui-locale';

type LiveCapturePreviewProps = {
    isSharing: boolean;
    stream: MediaStream | null;
    isBusy: boolean;
    capturedFrame?: Blob | null;
    previewSrc?: string | null;
    error?: string | null;
    onStartSharing: () => void;
};

export default function LiveCapturePreview({
    isSharing,
    stream,
    isBusy,
    capturedFrame,
    previewSrc,
    error,
    onStartSharing,
}: LiveCapturePreviewProps) {
    const { locale } = useUiLocale();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const capturedFrameUrl = useMemo(() => {
        if (!capturedFrame || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
            return null;
        }

        return URL.createObjectURL(capturedFrame);
    }, [capturedFrame]);

    useEffect(() => {
        return () => {
            if (capturedFrameUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
                URL.revokeObjectURL(capturedFrameUrl);
            }
        };
    }, [capturedFrameUrl]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) {
            return;
        }

        if (isSharing && stream) {
            video.srcObject = stream;
            void video.play().catch(() => {});
            return;
        }

        video.srcObject = null;
    }, [isSharing, stream]);

    const activePreviewSrc = previewSrc ?? capturedFrameUrl;

    if (isBusy && !isSharing && !activePreviewSrc) {
        return <LoadingState lines={2} />;
    }

    if (!isSharing && !activePreviewSrc) {
        return (
            <EmptyState
                icon={MonitorUp}
                title={locale === 'ar' ? 'لا توجد مشاركة شاشة نشطة' : 'No active screen sharing'}
                description={
                    locale === 'ar'
                        ? 'ابدأ مشاركة تبويب أو نافذة أو الشاشة بالكامل حتى يرى المساعد سياق المشكلة والمحرر الحالي.'
                        : 'Start sharing a tab, window, or full screen so the assistant can see the current problem and editor context.'
                }
                actionLabel={locale === 'ar' ? 'ابدأ المشاركة' : 'Start sharing'}
                onAction={onStartSharing}
            />
        );
    }

    return (
        <div className="overflow-hidden rounded-[28px] border border-[var(--app-border)] bg-slate-950/55 shadow-sm">
            <div className="relative aspect-[16/10] bg-[linear-gradient(180deg,#fdfbff_0%,#f4f0ff_100%)]">
                {isSharing && stream ? (
                    <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-contain" />
                ) : activePreviewSrc ? (
                    <img src={activePreviewSrc} alt="Captured workspace context" className="h-full w-full object-contain" />
                ) : null}

                <div className="absolute right-4 top-4 flex flex-wrap items-center gap-2">
                    <Badge variant={isSharing ? 'success' : 'subtle'}>{isSharing ? (locale === 'ar' ? 'مشاركة حية' : 'Live sharing') : (locale === 'ar' ? 'آخر إطار محفوظ' : 'Last saved frame')}</Badge>
                    {isBusy && <Badge variant="app">{locale === 'ar' ? 'تتم مزامنة السياق' : 'Syncing context'}</Badge>}
                </div>
            </div>

            {error && <div className="border-t border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
        </div>
    );
}
