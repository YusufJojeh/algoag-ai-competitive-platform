import { expect, test } from '@playwright/test';

import { expectDirection, expectLocalizedTexts, expectNoRawTranslationArtifacts } from '../helpers/i18n';
import { LOCALES } from '../helpers/locale';
import { gotoRuntimePage, prepareLandingForVisualCapture } from '../helpers/visual';

test.describe('Landing page runtime coverage', () => {
    for (const locale of LOCALES) {
        test(`landing renders correctly in ${locale.id}`, async ({ page }) => {
            await gotoRuntimePage(page, 'landing', {}, locale.id);
            await prepareLandingForVisualCapture(page);

            await expect(page.getByTestId('landing-page')).toBeVisible();
            await expectDirection(page, locale.dir);
            await expectNoRawTranslationArtifacts(page);

            await expectLocalizedTexts(page.getByTestId('landing-page'), locale.id === 'ar'
                ? ['التجربة', 'الميزات', 'كيف يعمل', 'الثقة', 'ابدأ الآن']
                : ['Experience', 'Features', 'How it works', 'Trust', 'Get started']);

            await expect(page.locator('#hero')).toBeVisible();
            await expect(page.locator('#experience')).toBeVisible();
            await expect(page.locator('#cta')).toBeVisible();
        });
    }
});
