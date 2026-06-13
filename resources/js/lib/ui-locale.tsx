import { createContext, useContext, useEffect, type ReactNode } from 'react';

export type UiLocale = 'ar' | 'en';
export type UiDirection = 'rtl' | 'ltr';

type UiLocaleContextValue = {
    locale: UiLocale;
    dir: UiDirection;
    isRtl: boolean;
    switchTo: (locale: UiLocale) => void;
    switchHref: (locale: UiLocale) => string;
};

const UiLocaleContext = createContext<UiLocaleContextValue>({
    locale: 'ar',
    dir: 'rtl',
    isRtl: true,
    switchTo: () => {},
    switchHref: () => '?ui_locale=ar',
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

    const switchHref = (nextLocale: UiLocale): string => {
        if (typeof window === 'undefined') {
            return `?ui_locale=${nextLocale}`;
        }

        const url = new URL(window.location.href);
        url.searchParams.set('ui_locale', nextLocale);

        return `${url.pathname}${url.search}${url.hash}`;
    };

    const switchTo = (nextLocale: UiLocale) => {
        if (typeof window === 'undefined' || nextLocale === resolvedLocale) {
            return;
        }

        window.location.assign(switchHref(nextLocale));
    };

    useEffect(() => {
        document.documentElement.lang = resolvedLocale;
        document.documentElement.dir = resolvedDir;
        document.body.dataset.uiLocale = resolvedLocale;
        document.body.dataset.uiDirection = resolvedDir;
    }, [resolvedLocale, resolvedDir]);

    return (
        <UiLocaleContext.Provider value={{ locale: resolvedLocale, dir: resolvedDir, isRtl: resolvedDir === 'rtl', switchTo, switchHref }}>
            {children}
        </UiLocaleContext.Provider>
    );
}

export function useUiLocale() {
    return useContext(UiLocaleContext);
}
