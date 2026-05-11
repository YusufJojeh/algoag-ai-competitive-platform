import { expect, type Locator, type Page } from '@playwright/test';

import type { TestLocale } from './locale';
import { RAW_TRANSLATION_PATTERNS } from './locale';

export async function expectDirection(page: Page, dir: 'rtl' | 'ltr') {
    await expect(page.locator('html')).toHaveAttribute('dir', dir);
    await expect(page.locator('body')).toHaveAttribute('data-ui-direction', dir);
}

export async function expectNoRawTranslationArtifacts(page: Page) {
    const text = await page.locator('body').innerText();

    RAW_TRANSLATION_PATTERNS.forEach((pattern) => {
        expect.soft(text).not.toMatch(pattern);
    });
}

export async function expectLocalizedTexts(locator: Locator, values: string[]) {
    for (const value of values) {
        await expect(locator.getByText(value, { exact: false }).first()).toBeVisible();
    }
}

export async function expectNoForeignUiStrings(locator: Locator, locale: TestLocale, values: string[]) {
    for (const value of values) {
        if (locale === 'ar') {
            await expect(locator.getByText(value, { exact: false })).toHaveCount(0);
        } else {
            await expect(locator.getByText(value, { exact: false })).toHaveCount(0);
        }
    }
}
