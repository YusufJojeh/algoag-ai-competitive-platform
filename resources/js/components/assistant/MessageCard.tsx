import { Bot, UserRound } from 'lucide-react';

import AudioReplyPlayer from '@/components/context/AudioReplyPlayer';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getModeMeta, type ThreadMessage } from '@/lib/assistant-workspace';
import { useUiLocale } from '@/lib/ui-locale';

type MessageCardProps = {
    message: ThreadMessage;
    streaming?: boolean;
};

export default function MessageCard({ message, streaming = false }: MessageCardProps) {
    const { locale } = useUiLocale();
    const mode = message.mode ? getModeMeta(message.mode, locale) : null;
    const isAssistant = message.role === 'assistant';

    return (
        <Card
            className={[
                'rounded-[30px] border px-5 py-4 shadow-sm transition',
                isAssistant
                    ? 'border-violet-300/18 bg-slate-950/55'
                    : 'border-[var(--app-border)] bg-slate-900/70',
            ].join(' ')}
        >
        <article>
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div
                        className={[
                            'flex h-10 w-10 items-center justify-center rounded-[18px]',
                            isAssistant ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent-strong)]' : 'bg-cyan-400/10 text-cyan-200',
                        ].join(' ')}
                    >
                        {isAssistant ? <Bot className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-[var(--app-foreground)]">{isAssistant ? (locale === 'ar' ? 'المساعد' : 'Assistant') : (locale === 'ar' ? 'أنت' : 'You')}</p>
                        <p className="text-xs text-[var(--app-muted)]">
                            {isAssistant
                                ? (locale === 'ar' ? 'تحليل تعليمي محدث' : 'Teaching analysis')
                                : (locale === 'ar' ? 'ملخص الفكرة الحالية' : 'Current idea summary')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {mode && <Badge variant="app">{mode.shortLabel}</Badge>}
                    {streaming && <Badge variant="subtle">{locale === 'ar' ? 'قيد التحديث' : 'Updating'}</Badge>}
                </div>
            </div>

            <div className="space-y-4">
                <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--app-foreground)]">{message.content}</p>
                {message.audioUrl && <AudioReplyPlayer src={message.audioUrl} compact />}
            </div>
        </article>
        </Card>
    );
}
