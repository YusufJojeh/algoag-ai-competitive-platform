import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

function getSpeechRecognition() {
    if (typeof window === 'undefined') return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function useVoiceInput(initialLanguage = 'ar-SA') {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [audioBlob, setAudioBlob] = useState(null);
    const [error, setError] = useState(null);
    const [language, setLanguage] = useState(initialLanguage);

    const recognitionRef = useRef(null);
    const recorderRef = useRef(null);
    const chunksRef = useRef([]);

    const SpeechRecognitionCtor = useMemo(() => getSpeechRecognition(), []);
    const isSpeechSupported = !!SpeechRecognitionCtor;
    const isFallbackMode = !isSpeechSupported;
    const isSupported = isSpeechSupported || (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');

    const startSpeechRecognition = useCallback(() => {
        const Ctor = getSpeechRecognition();
        if (!Ctor) return;
        const recognition = new Ctor();
        recognition.lang = language;
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            let final = '';
            let interim = '';
            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    final += result[0].transcript;
                } else {
                    interim += result[0].transcript;
                }
            }
            setTranscript(final + interim);
        };

        recognition.onerror = (event) => {
            if (event.error === 'not-allowed') {
                setError('تم رفض إذن الميكروفون');
            } else if (event.error !== 'aborted') {
                setError('خطأ في التعرف على الكلام: ' + event.error);
            }
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
        setError(null);
    }, [language]);

    const startMediaRecorder = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach((t) => t.stop());
                setIsRecording(false);
            };

            recorder.onerror = () => {
                setError('خطأ في التسجيل الصوتي');
                setIsRecording(false);
            };

            recorderRef.current = recorder;
            recorder.start();
            setIsRecording(true);
            setAudioBlob(null);
            setError(null);
        } catch (err) {
            if (err.name === 'NotAllowedError') {
                setError('تم رفض إذن الميكروفون');
            } else {
                setError('فشل في بدء التسجيل: ' + err.message);
            }
        }
    }, []);

    const startRecording = useCallback(() => {
        setError(null);
        if (isSpeechSupported) {
            startSpeechRecognition();
        } else if (isSupported) {
            startMediaRecorder();
        } else {
            setError('متصفحك لا يدعم التسجيل الصوتي');
        }
    }, [isSpeechSupported, isSupported, startSpeechRecognition, startMediaRecorder]);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        if (recorderRef.current && recorderRef.current.state === 'recording') {
            recorderRef.current.stop();
            recorderRef.current = null;
        }
        setIsRecording(false);
    }, []);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) recognitionRef.current.abort();
            if (recorderRef.current && recorderRef.current.state === 'recording') {
                recorderRef.current.stop();
            }
        };
    }, []);

    return {
        isRecording,
        transcript,
        audioBlob,
        setAudioBlob,
        error,
        language,
        setLanguage,
        setTranscript,
        isSupported,
        isFallbackMode,
        startRecording,
        stopRecording,
    };
}
