import type { Page } from '@playwright/test';

export type TestLocale = 'ar' | 'en';

export const LOCALES: Array<{ id: TestLocale; dir: 'rtl' | 'ltr'; browserLocale: string }> = [
    { id: 'ar', dir: 'rtl', browserLocale: 'ar-EG' },
    { id: 'en', dir: 'ltr', browserLocale: 'en-US' },
];

export const RAW_TRANSLATION_PATTERNS = [
    /\bapp\.[\w.-]+/i,
    /\bcommon\.[\w.-]+/i,
    /\bauth\.[\w.-]+/i,
    /\bassistant\.[\w.-]+/i,
    /\btranslation_missing\b/i,
    /\bundefined\b/i,
    /\bnull\b/i,
];

export async function setBrowserLocale(page: Page, locale: TestLocale) {
    await page.addInitScript((activeLocale) => {
        Object.defineProperty(navigator, 'language', {
            configurable: true,
            value: activeLocale === 'ar' ? 'ar-EG' : 'en-US',
        });

        Object.defineProperty(navigator, 'languages', {
            configurable: true,
            value: activeLocale === 'ar' ? ['ar-EG', 'ar'] : ['en-US', 'en'],
        });
    }, locale);
}
