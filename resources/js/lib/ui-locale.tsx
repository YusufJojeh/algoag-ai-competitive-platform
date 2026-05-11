import { createContext, useContext, useEffect, type ReactNode } from 'react';

export type UiLocale = 'ar' | 'en';
export type UiDirection = 'rtl' | 'ltr';

type UiLocaleContextValue = {
    locale: UiLocale;
    dir: UiDirection;
    isRtl: boolean;
};

const UiLocaleContext = createContext<UiLocaleContextValue>({
    locale: 'ar',
    dir: 'rtl',
    isRtl: true,
});

type UiLocaleProviderProps = {
    locale?: string;
    dir?: string;
    children: ReactNode;
};

export function resolveUiLocale(locale?: string): UiLocale {
    return locale === 'en' ? 'en' : 'ar';
}

export function getUiDirection(locale: string): UiDirection {
    return resolveUiLocale(locale) === 'en' ? 'ltr' : 'rtl';
}

export function getSpeechLanguage(locale: string): 'ar-SA' | 'en-US' {
    return resolveUiLocale(locale) === 'en' ? 'en-US' : 'ar-SA';
}

export function UiLocaleProvider({ locale, dir, children }: UiLocaleProviderProps) {
    const resolvedLocale = resolveUiLocale(locale);
    const resolvedDir = dir === 'ltr' || dir === 'rtl' ? dir : getUiDirection(resolvedLocale);

    useEffect(() => {
        document.documentElement.lang = resolvedLocale;
        document.documentElement.dir = resolvedDir;
        document.body.dataset.uiLocale = resolvedLocale;
        document.body.dataset.uiDirection = resolvedDir;
    }, [resolvedLocale, resolvedDir]);

    return (
        <UiLocaleContext.Provider value={{ locale: resolvedLocale, dir: resolvedDir, isRtl: resolvedDir === 'rtl' }}>
            {children}
        </UiLocaleContext.Provider>
    );
}

export function useUiLocale() {
    return useContext(UiLocaleContext);
}
