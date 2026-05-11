import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

type EmptyStateProps = {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
};

export default function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction,
}: EmptyStateProps) {
    return (
        <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-[28px] border border-dashed border-[var(--app-border-strong)] bg-slate-950/35 px-6 py-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-[var(--app-accent-soft)] text-[var(--app-accent-strong)]">
                <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--app-foreground)]">{title}</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--app-muted)]">{description}</p>
            {(actionLabel || secondaryActionLabel) && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    {actionLabel && onAction && (
                        <Button variant="lavender" onClick={onAction}>
                            {actionLabel}
                        </Button>
                    )}
                    {secondaryActionLabel && onSecondaryAction && (
                        <Button variant="soft" onClick={onSecondaryAction}>
                            {secondaryActionLabel}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
