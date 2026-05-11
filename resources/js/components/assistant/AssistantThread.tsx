import { MessageSquareDashed, Sparkles } from 'lucide-react';

import AssistantStateCard from '@/components/assistant/AssistantStateCard';
import MessageCard from '@/components/assistant/MessageCard';
import EmptyState from '@/components/shared/EmptyState';
import LoadingState from '@/components/shared/LoadingState';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { StreamStatus, ThreadMessage, WorkspaceEvent } from '@/lib/assistant-workspace';
import { getStatusMeta } from '@/lib/assistant-workspace';
import { useUiLocale } from '@/lib/ui-locale';

type AssistantThreadProps = {
    messages: ThreadMessage[];
    currentPartialText: string;
    status: StreamStatus;
    loading: boolean;
    onStartSharing: () => void;
    recentEvents: WorkspaceEvent[];
};

export default function AssistantThread({
    messages,
    currentPartialText,
    status,
    loading,
    onStartSharing,
    recentEvents,
}: AssistantThreadProps) {
    const { locale } = useUiLocale();
    const activeStatus = getStatusMeta(status, locale);
    const showEmpty = messages.length === 0 && !currentPartialText && status === 'idle';

    return (
        <ScrollArea className="h-full px-6 py-6 app-scroll" data-testid="assistant-thread">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
                {showEmpty && (
                    <EmptyState
                        icon={MessageSquareDashed}
                        title={locale === 'ar' ? 'ابدأ جلسة تحليل جديدة' : 'Start a new analysis session'}
                        description={
                            locale === 'ar'
                                ? 'شارك شاشة المسألة أو المحرر، ثم صف فكرتك بصوتك أو بنص مختصر ليبني المساعد تحليلاً تعليمياً متدرجاً.'
                                : 'Share the problem or editor screen, then describe your idea by voice or short text so the assistant can build a guided analysis.'
                        }
                        actionLabel={locale === 'ar' ? 'ابدأ مشاركة الشاشة' : 'Start screen sharing'}
                        onAction={onStartSharing}
                    />
                )}

                {status !== 'idle' && (
                    <AssistantStateCard
                        icon={activeStatus.icon}
                        title={activeStatus.label}
                        description={activeStatus.description}
                        tone={activeStatus.tone}
                    />
                )}

                {loading && messages.length === 0 && <LoadingState lines={4} />}

                {messages.map((message) => (
                    <MessageCard key={message.id} message={message} />
                ))}

                {currentPartialText && (
                    <MessageCard
                        message={{
                            id: 'streaming-message',
                            role: 'assistant',
                            content: currentPartialText,
                        }}
                        streaming
                    />
                )}

                {recentEvents.slice(0, 2).map((event, index) => (
                    <div key={`${event.id}-${index}`} className="rounded-[24px] border border-dashed border-[var(--app-border)] bg-slate-950/35 px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-[var(--app-muted)]">
                            <Sparkles className="h-3.5 w-3.5" />
                            {event.createdAt}
                        </div>
                        <p className="mt-2 text-sm font-semibold text-[var(--app-foreground)]">{event.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">{event.description}</p>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
