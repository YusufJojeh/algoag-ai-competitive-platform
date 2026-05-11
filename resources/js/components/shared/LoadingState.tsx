import { Skeleton } from '@/components/ui/skeleton';

type LoadingStateProps = {
    compact?: boolean;
    lines?: number;
};

export default function LoadingState({ compact = false, lines = 3 }: LoadingStateProps) {
    return (
        <div className="space-y-4 rounded-[28px] border border-[var(--app-border)] bg-slate-950/40 p-5">
            <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-56" />
            </div>
            <div className="space-y-3">
                {Array.from({ length: compact ? Math.min(lines, 2) : lines }).map((_, index) => (
                    <Skeleton
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                        className={`h-4 ${index === lines - 1 ? 'w-3/5' : 'w-full'}`}
                    />
                ))}
            </div>
            {!compact && <Skeleton className="h-44 w-full rounded-[24px]" />}
        </div>
    );
}
