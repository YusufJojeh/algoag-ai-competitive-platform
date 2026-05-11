import { getAssistantModes, type AssistantMode } from '@/lib/assistant-workspace';
import { useUiLocale } from '@/lib/ui-locale';

import { Button } from '@/components/ui/button';

type QuickModesBarProps = {
    selectedMode: AssistantMode;
    onModeChange: (mode: AssistantMode) => void;
    disabled?: boolean;
};

export default function QuickModesBar({ selectedMode, onModeChange, disabled = false }: QuickModesBarProps) {
    const { locale } = useUiLocale();
    const assistantModes = getAssistantModes(locale);

    return (
        <div className="space-y-3" data-testid="quick-modes-bar">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-[var(--app-foreground)]">{locale === 'ar' ? 'أنماط المساعدة' : 'Assistant modes'}</p>
                    <p className="text-xs text-[var(--app-muted)]">
                        {locale === 'ar' ? 'اختر نوع الاستجابة قبل إرسال السياق الحالي.' : 'Choose the reply style before sending the current context.'}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {assistantModes.map((mode) => {
                    const Icon = mode.icon;
                    const active = selectedMode === mode.id;

                    return (
                        <Button
                            key={mode.id}
                            type="button"
                            variant={active ? 'lavender' : 'surface'}
                            size="sm"
                            disabled={disabled}
                            onClick={() => onModeChange(mode.id)}
                            className={active ? 'rounded-2xl' : 'rounded-2xl text-[var(--app-muted-strong)]'}
                        >
                            <Icon className="h-4 w-4" />
                            {mode.shortLabel}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
