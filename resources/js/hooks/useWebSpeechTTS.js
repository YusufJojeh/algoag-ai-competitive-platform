import { useState, useCallback, useEffect } from 'react';

export default function useWebSpeechTTS() {
    const [isSpeaking, setIsSpeaking] = useState(false);

    const isSupported =
        typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';

    const stop = useCallback(() => {
        if (!isSupported) return;
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, [isSupported]);

    const speak = useCallback(
        (text, lang = 'ar') => {
            if (!isSupported || !text?.trim()) return;
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang === 'en' ? 'en-US' : 'ar-SA';
            utterance.rate = 0.95;
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        },
        [isSupported],
    );

    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
        };
    }, [isSupported]);

    return { isSpeaking, isSupported, speak, stop };
}
