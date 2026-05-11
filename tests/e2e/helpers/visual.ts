import { expect, type Locator, type Page } from '@playwright/test';

import { setBrowserLocale, type TestLocale } from './locale';
import { buildRuntimeRoute, buildVisualRoute, type RuntimePageName, type VisualPageName } from './routes';

export const VISUAL_READY_IDS = {
    landing: 'landing-page',
    login: 'login-page',
    assistant: 'assistant-workspace-shell',
} as const;

export const SNAPSHOT_OPTIONS = {
    animations: 'disabled' as const,
    caret: 'hide' as const,
    scale: 'css' as const,
    maxDiffPixelRatio: 0.01,
};

export async function prepareVisualPage(page: Page) {
    await page.addInitScript(() => {
        const fixedTime = new Date('2026-04-05T10:00:00.000Z').valueOf();
        const NativeDate = Date;

        class MockDate extends NativeDate {
            constructor(...args: ConstructorParameters<typeof Date>) {
                if (args.length === 0) {
                    super(fixedTime);
                    return;
                }

                super(...args);
            }

            static now() {
                return fixedTime;
            }
        }

        Object.defineProperty(window, 'Date', {
            configurable: true,
            writable: true,
            value: MockDate,
        });

        Math.random = () => 0.123456789;
        window.open = () => null;

        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: (query: string) => ({
                matches: query.includes('prefers-reduced-motion'),
                media: query,
                onchange: null,
                addListener: () => {},
                removeListener: () => {},
                addEventListener: () => {},
                removeEventListener: () => {},
                dispatchEvent: () => false,
            }),
        });
    });
}

export async function prepareLocalePage(page: Page, locale: TestLocale) {
    await setBrowserLocale(page, locale);
    await prepareVisualPage(page);
}

export async function gotoVisualPage(
    page: Page,
    pageName: VisualPageName,
    params: Record<string, string | undefined> = {},
    locale: TestLocale = 'ar'
) {
    await prepareLocalePage(page, locale);
    await page.goto(buildVisualRoute(pageName, { ...params, ui_locale: locale }), { waitUntil: 'networkidle' });
    await waitForVisualReady(page, VISUAL_READY_IDS[pageName]);
    await stabilizeVisuals(page);
}

export async function gotoRuntimePage(
    page: Page,
    pageName: RuntimePageName,
    params: Record<string, string | undefined> = {},
    locale: TestLocale = 'ar'
) {
    await prepareLocalePage(page, locale);
    await page.goto(buildRuntimeRoute(pageName, { ...params, ui_locale: locale }), { waitUntil: 'networkidle' });
    if (pageName === 'landing') {
        await waitForVisualReady(page, VISUAL_READY_IDS.landing);
    }
    if (pageName === 'login') {
        await waitForVisualReady(page, VISUAL_READY_IDS.login);
    }
    if (pageName === 'assistant') {
        await waitForVisualReady(page, VISUAL_READY_IDS.assistant);
    }
    await stabilizeVisuals(page);
}

export async function prepareLandingForVisualCapture(page: Page) {
    const sections = ['#hero', '#experience', '#features', '#how-it-works', '#trust', '#cta'];

    for (const selector of sections) {
        const locator = page.locator(selector);

        if (await locator.count()) {
            await locator.scrollIntoViewIfNeeded();
            await page.evaluate(async () => {
                await new Promise<void>((resolve) => {
                    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
                });
            });
            await page.waitForTimeout(150);
        }
    }

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'auto' }));
    await page.waitForTimeout(250);
    await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
    });
}

export async function waitForVisualReady(page: Page, testId: string) {
    await expect(page.getByTestId(testId)).toBeVisible();
    await page.evaluate(async () => {
        if ('fonts' in document) {
            await document.fonts.ready;
        }

        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
    });
}

export async function stabilizeVisuals(page: Page) {
    await page.addStyleTag({
        content: `
            *,
            *::before,
            *::after {
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
                caret-color: transparent !important;
            }

            html {
                scroll-behavior: auto !important;
            }
        `,
    });
}

export async function expectVisualSnapshot(locator: Locator, name: string) {
    await expect(locator).toHaveScreenshot(name, SNAPSHOT_OPTIONS);
}

export async function expectFullPageSnapshot(page: Page, name: string) {
    await expect(page).toHaveScreenshot(name, {
        ...SNAPSHOT_OPTIONS,
        fullPage: true,
    });
}
