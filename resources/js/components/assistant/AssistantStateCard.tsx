import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useUiLocale } from '@/lib/ui-locale';

type AssistantStateCardProps = {
    icon: LucideIcon;
    title: string;
    description: string;
    tone: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
};

const toneClasses = {
    neutral: 'border-[var(--app-border)] bg-white/88 text-[var(--app-muted-strong)]',
    accent: 'border-violet-200 bg-violet-50/90 text-violet-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
};

export default function AssistantStateCard({ icon: Icon, title, description, tone }: AssistantStateCardProps) {
    const { locale } = useUiLocale();

    return (
        <Card className={`rounded-[26px] px-4 py-4 ${toneClasses[tone]}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-[18px] bg-white/70">
                        <Icon className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold">{title}</p>
                        <p className="mt-1 text-sm leading-6 opacity-90">{description}</p>
                    </div>
                </div>
                <Badge
                    variant={
                        tone === 'danger'
                            ? 'danger'
                            : tone === 'warning'
                                ? 'warning'
                                : tone === 'success'
                                    ? 'success'
                                    : tone === 'accent'
                                        ? 'app'
                                        : 'subtle'
                    }
                >
                    {locale === 'ar' ? 'حالة' : 'Status'}
                </Badge>
            </div>
        </Card>
    );
}
