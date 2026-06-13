import { useState, useRef, useCallback, useEffect } from 'react';

// Full-HD frames at high JPEG quality so the Vision model can read code and
// problem statements; 1280×720 @ 0.7 was too blurry for small editor fonts.
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const JPEG_QUALITY = 0.85;

export default function useScreenCapture() {
    const [isSharing, setIsSharing] = useState(false);
    const [error, setError] = useState(null);
    const streamRef = useRef(null);
    const videoRef = useRef(null);

    const isSupported = typeof navigator !== 'undefined'
        && navigator.mediaDevices
        && typeof navigator.mediaDevices.getDisplayMedia === 'function';

    const startSharing = useCallback(async () => {
        if (!isSupported) {
            setError('متصفحك لا يدعم مشاركة الشاشة');
            return;
        }

        setError(null);

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { width: { ideal: MAX_WIDTH }, height: { ideal: MAX_HEIGHT } },
                audio: false,
            });

            streamRef.current = stream;
            setIsSharing(true);

            const track = stream.getVideoTracks()[0];
            if (track) {
                track.addEventListener('ended', () => {
                    streamRef.current = null;
                    setIsSharing(false);
                });
            }
        } catch (err) {
            if (err.name === 'NotAllowedError') {
                setError('تم رفض إذن مشاركة الشاشة');
            } else {
                setError('فشل في بدء مشاركة الشاشة: ' + err.message);
            }
            setIsSharing(false);
        }
    }, [isSupported]);

    const stopSharing = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        setIsSharing(false);
        setError(null);
    }, []);

    const captureFrame = useCallback(() => {
        return new Promise((resolve, reject) => {
            const stream = streamRef.current;
            if (!stream || !stream.active) {
                reject(new Error('لا توجد مشاركة شاشة نشطة'));
                return;
            }

            const track = stream.getVideoTracks()[0];
            if (!track) {
                reject(new Error('لا يوجد مسار فيديو'));
                return;
            }

            const video = videoRef.current || document.createElement('video');
            videoRef.current = video;
            video.srcObject = stream;
            video.muted = true;

            const doCapture = () => {
                let w = video.videoWidth;
                let h = video.videoHeight;

                if (w > MAX_WIDTH || h > MAX_HEIGHT) {
                    const scale = Math.min(MAX_WIDTH / w, MAX_HEIGHT / h);
                    w = Math.round(w * scale);
                    h = Math.round(h * scale);
                }

                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, w, h);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('فشل في التقاط الإطار'));
                        }
                    },
                    'image/jpeg',
                    JPEG_QUALITY,
                );
            };

            if (video.readyState >= 2) {
                doCapture();
            } else {
                video.onloadeddata = doCapture;
                video.play().catch(() => reject(new Error('فشل في تشغيل الفيديو')));
            }
        });
    }, []);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
        };
    }, []);

    return {
        isSharing,
        stream: streamRef.current,
        error,
        isSupported,
        startSharing,
        stopSharing,
        captureFrame,
        videoRef,
    };
}
