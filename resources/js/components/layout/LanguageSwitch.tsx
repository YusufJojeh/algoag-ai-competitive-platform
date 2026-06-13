import { Languages } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useUiLocale, type UiLocale } from '@/lib/ui-locale';

const labels: Record<UiLocale, string> = {
    ar: 'عربي',
    en: 'English',
};

type LanguageSwitchButtonProps = {
    className?: string;
};

export function LanguageSwitchButton({ className }: LanguageSwitchButtonProps) {
    const { locale, switchTo, switchHref } = useUiLocale();
    const nextLocale: UiLocale = locale === 'ar' ? 'en' : 'ar';

    return (
        <Button
            asChild
            type="button"
            variant="surface"
            size="sm"
            className={className ?? 'rounded-2xl border-[var(--app-border)] bg-slate-950/80 px-3 shadow-lg shadow-black/20 backdrop-blur'}
            onClick={(event) => {
                event.preventDefault();
                switchTo(nextLocale);
            }}
        >
            <a href={switchHref(nextLocale)} lang={nextLocale} hrefLang={nextLocale} aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}>
                <Languages className="h-4 w-4" />
                <span className="hidden sm:inline">{labels[nextLocale]}</span>
                <span className="sm:hidden">{nextLocale.toUpperCase()}</span>
            </a>
        </Button>
    );
}

export default function LanguageSwitch() {
    const { isRtl } = useUiLocale();

    return (
        <div
            className={[
                'fixed top-4 z-50',
                isRtl ? 'left-4' : 'right-4',
            ].join(' ')}
            data-testid="global-language-switch"
        >
            <LanguageSwitchButton />
        </div>
    );
}
