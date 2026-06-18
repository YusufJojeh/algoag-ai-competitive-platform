import { getAssistantModeSelectGroups, getModeMeta, type AssistantMode } from '@/lib/assistant-workspace';
import { Card } from '@/components/ui/card';
import { useUiLocale } from '@/lib/ui-locale';

type QuickModesBarProps = {
    selectedMode: AssistantMode;
    onModeChange: (mode: AssistantMode) => void;
    disabled?: boolean;
};

export default function QuickModesBar({ selectedMode, onModeChange, disabled = false }: QuickModesBarProps) {
    const { locale } = useUiLocale();
    const modeGroups = getAssistantModeSelectGroups(locale);
    const selectedMeta = getModeMeta(selectedMode, locale);
    const SelectedIcon = selectedMeta.icon;
    const descriptionId = 'assistant-mode-description';

    return (
        <div className="space-y-3" data-testid="quick-modes-bar">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] md:items-end">
                <div className="min-w-0">
                    <label htmlFor="assistant-mode-select" className="text-sm font-semibold text-[var(--app-foreground)]">
                        {locale === 'ar' ? 'نمط المساعد' : 'Assistant mode'}
                    </label>
                    <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
                        {locale === 'ar' ? 'اختيار واحد فقط يحدد طريقة رد المساعد قبل إرسال السياق.' : 'One dropdown controls the assistant reply style before you send context.'}
                    </p>
                </div>

                <select
                    id="assistant-mode-select"
                    data-testid="assistant-mode-select"
                    value={selectedMode}
                    disabled={disabled}
                    aria-describedby={descriptionId}
                    onChange={(event) => onModeChange(event.target.value as AssistantMode)}
                    className="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-slate-950/70 px-4 text-sm font-semibold text-[var(--app-foreground)] shadow-sm outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/35 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {modeGroups.map((group) => (
                        <optgroup key={group.id} label={group.label}>
                            {group.modes.map((mode) => (
                                <option key={mode.id} value={mode.id} title={mode.description}>
                                    {mode.shortLabel} - {mode.label}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
            </div>

            <Card id={descriptionId} className="flex items-start gap-3 rounded-2xl px-4 py-3" aria-live="polite">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                    <SelectedIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--app-foreground)]">{selectedMeta.label}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--app-muted-strong)]">{selectedMeta.description}</p>
                </div>
            </Card>
        </div>
    );
}
