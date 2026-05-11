import { Languages, Mic, MicOff, Paperclip, RotateCw, SendHorizontal, Square } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getModeMeta, type AssistantMode } from '@/lib/assistant-workspace';
import { useUiLocale } from '@/lib/ui-locale';

type TranscriptComposerProps = {
    transcript: string;
    language: string;
    selectedMode: AssistantMode;
    isRecording: boolean;
    isBusy: boolean;
    canSubmit: boolean;
    hasCapturedFrame: boolean;
    hasAudioBlob: boolean;
    isFallbackMode: boolean;
    error?: string | null;
    onTranscriptChange: (value: string) => void;
    onLanguageChange: (value: string) => void;
    onRefreshCapture: () => void;
    onStartRecording: () => void;
    onStopRecording: () => void;
    onSubmit: () => void;
    onCancel: () => void;
};

export default function TranscriptComposer({
    transcript,
    language,
    selectedMode,
    isRecording,
    isBusy,
    canSubmit,
    hasCapturedFrame,
    hasAudioBlob,
    isFallbackMode,
    error,
    onTranscriptChange,
    onLanguageChange,
    onRefreshCapture,
    onStartRecording,
    onStopRecording,
    onSubmit,
    onCancel,
}: TranscriptComposerProps) {
    const { locale } = useUiLocale();
    const mode = getModeMeta(selectedMode, locale);

    return (
        <div className="border-t border-[var(--app-border)] bg-slate-950/90 px-6 py-5 backdrop-blur" data-testid="transcript-composer">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="app">{mode.shortLabel}</Badge>
                        <Badge variant="subtle">{hasCapturedFrame ? (locale === 'ar' ? 'تم تجهيز الإطار' : 'Frame ready') : (locale === 'ar' ? 'بانتظار الإطار' : 'Waiting for frame')}</Badge>
                        {hasAudioBlob && <Badge variant="success">{locale === 'ar' ? 'يوجد تسجيل صوتي' : 'Audio attached'}</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="surface" size="sm" onClick={onRefreshCapture}>
                            <RotateCw className="h-4 w-4" />
                            {locale === 'ar' ? 'تحديث الإطار' : 'Refresh frame'}
                        </Button>
                        <div className="flex items-center rounded-2xl border border-[var(--app-border)] bg-slate-950/55 p-1 shadow-sm">
                            <Button
                                type="button"
                                variant={language === 'ar-SA' ? 'soft' : 'ghost'}
                                size="sm"
                                className="rounded-xl text-[var(--app-muted-strong)]"
                                onClick={() => onLanguageChange('ar-SA')}
                            >
                                <Languages className="h-4 w-4" />
                                {locale === 'ar' ? 'عربي' : 'Arabic'}
                            </Button>
                            <Button
                                type="button"
                                variant={language === 'en-US' ? 'soft' : 'ghost'}
                                size="sm"
                                className="rounded-xl text-[var(--app-muted-strong)]"
                                onClick={() => onLanguageChange('en-US')}
                            >
                                English
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-3 shadow-sm">
                    <Textarea
                        value={transcript}
                        onChange={(event) => onTranscriptChange(event.target.value)}
                        placeholder={
                            locale === 'ar'
                                ? 'اشرح فكرتك الحالية، أو اطلب تلميحاً، أو اذكر موضع الشك في المنطق...'
                                : 'Explain your current idea, ask for a hint, or point to the logic you are unsure about...'
                        }
                        className="min-h-[136px] border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
                    />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--app-border)] px-2 pt-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                variant={isRecording ? 'danger' : 'surface'}
                                size="sm"
                                onClick={isRecording ? onStopRecording : onStartRecording}
                            >
                                {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                {isRecording ? (locale === 'ar' ? 'إيقاف التسجيل' : 'Stop recording') : (locale === 'ar' ? 'ابدأ التسجيل' : 'Start recording')}
                            </Button>
                            {isFallbackMode && (
                                <Badge variant="warning">
                                    <Paperclip className="h-3.5 w-3.5" />
                                    {locale === 'ar' ? 'تحويل الصوت سيتم على الخادم' : 'Audio transcription will run on the server'}
                                </Badge>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {isBusy && (
                                <Button type="button" variant="surface" size="sm" onClick={onCancel}>
                                    <MicOff className="h-4 w-4" />
                                    {locale === 'ar' ? 'إلغاء الدورة' : 'Cancel run'}
                                </Button>
                            )}
                            <Button type="button" variant="lavender" onClick={onSubmit} disabled={!canSubmit || isBusy}>
                                <SendHorizontal className="h-4 w-4" />
                                {isBusy ? (locale === 'ar' ? 'جاري التحليل...' : 'Analyzing...') : (locale === 'ar' ? 'أرسل للتحليل' : 'Send for analysis')}
                            </Button>
                        </div>
                    </div>
                </div>

                {error && (
                    <Alert className="border-rose-400/20 bg-rose-400/10 text-rose-200">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
    );
}
