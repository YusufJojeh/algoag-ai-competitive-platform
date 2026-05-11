import { expect, test } from '@playwright/test';

import { LOCALES } from '../helpers/locale';
import { expectVisualSnapshot, gotoVisualPage, prepareLandingForVisualCapture, SNAPSHOT_OPTIONS } from '../helpers/visual';

test.describe('Landing visual regression', () => {
    for (const locale of LOCALES) {
        test(`landing page full layout stays stable in ${locale.id}`, async ({ page }) => {
            await gotoVisualPage(page, 'landing', {}, locale.id);
            await prepareLandingForVisualCapture(page);
            await expect(page).toHaveScreenshot(`landing-${locale.id}-full-page.png`, {
                ...SNAPSHOT_OPTIONS,
                fullPage: true,
            });
        });

        test(`hero composition remains aligned in ${locale.id}`, async ({ page }, testInfo) => {
            test.skip(!['desktop-1440', 'tablet-768', 'mobile-390'].includes(testInfo.project.name));

            await gotoVisualPage(page, 'landing', {}, locale.id);
            await prepareLandingForVisualCapture(page);
            await expectVisualSnapshot(page.locator('#hero'), `landing-${locale.id}-hero-section.png`);
        });

        test(`major showcase and CTA sections remain premium in ${locale.id}`, async ({ page }, testInfo) => {
            test.skip(!['desktop-1440', 'mobile-390'].includes(testInfo.project.name));

            await gotoVisualPage(page, 'landing', {}, locale.id);
            await prepareLandingForVisualCapture(page);
            await expectVisualSnapshot(page.locator('#experience'), `landing-${locale.id}-experience-section.png`);
            await expectVisualSnapshot(page.locator('#cta'), `landing-${locale.id}-cta-section.png`);
        });
    }
});
