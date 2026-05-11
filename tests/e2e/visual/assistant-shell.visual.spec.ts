import { expect, test } from '@playwright/test';

import { LOCALES } from '../helpers/locale';
import { expectFullPageSnapshot, gotoVisualPage, SNAPSHOT_OPTIONS } from '../helpers/visual';

test.describe('Assistant shell visual regression', () => {
    for (const locale of LOCALES) {
        test(`assistant shell layout stays aligned in ${locale.id}`, async ({ page }) => {
            await gotoVisualPage(page, 'assistant', { scenario: 'completed' }, locale.id);
            await expectFullPageSnapshot(page, `assistant-shell-${locale.id}-layout-full-page.png`);
        });

        test(`assistant shell preserves independent scroll containers in ${locale.id}`, async ({ page }, testInfo) => {
            test.skip(!['desktop-1440', 'laptop-1280'].includes(testInfo.project.name));

            await gotoVisualPage(page, 'assistant', { scenario: 'history' }, locale.id);

            await page.getByTestId('assistant-thread').locator('[data-radix-scroll-area-viewport]').evaluate((element) => {
                element.scrollTop = element.scrollHeight;
            });

            await page.getByTestId('screen-context-panel').locator('[data-radix-scroll-area-viewport]').evaluate((element) => {
                element.scrollTop = element.scrollHeight;
            });

            await page.evaluate(async () => {
                await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
            });

            await expect(page).toHaveScreenshot(`assistant-shell-${locale.id}-scrolled-full-page.png`, {
                ...SNAPSHOT_OPTIONS,
                fullPage: true,
            });
        });
    }
});
