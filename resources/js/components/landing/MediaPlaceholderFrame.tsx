import { Badge } from '@/components/ui/badge';

type MediaPlaceholderFrameProps = {
    slot: string;
    title: string;
    description: string;
    type: 'motion' | 'vision' | 'voice';
    accent: 'cyan' | 'violet';
    chips?: string[];
    className?: string;
};

export default function MediaPlaceholderFrame({
    slot,
    title,
    description,
    type,
    accent,
    chips = [],
    className = '',
}: MediaPlaceholderFrameProps) {
    const accentClass = accent === 'cyan'
        ? 'border-cyan-300/20 bg-cyan-400/8'
        : 'border-violet-300/20 bg-violet-400/8';

    return (
        <div className={`rounded-[28px] border ${accentClass} p-5 backdrop-blur-sm ${className}`}>
            <div className="flex items-center justify-between gap-3">
                <Badge variant={accent === 'cyan' ? 'default' : 'violet'}>{slot}</Badge>
                <span className="text-xs uppercase tracking-[0.22em] text-slate-400">{type}</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
            {chips.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {chips.map((chip) => (
                        <Badge key={chip} variant="muted">
                            {chip}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
