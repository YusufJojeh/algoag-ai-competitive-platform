import { test } from '@playwright/test';

import { assistantModes } from '../fixtures/assistant';
import { LOCALES } from '../helpers/locale';
import { expectFullPageSnapshot, expectVisualSnapshot, gotoVisualPage } from '../helpers/visual';

test.describe('Assistant controls and quick modes', () => {
    for (const locale of LOCALES) {
        for (const mode of assistantModes) {
            test(`quick mode "${mode.id}" remains readable in ${locale.id}`, async ({ page }, testInfo) => {
                test.skip(!['desktop-1440', 'laptop-1280'].includes(testInfo.project.name));

                await gotoVisualPage(page, 'assistant', {
                    scenario: 'preview',
                    mode: mode.id,
                }, locale.id);

                await expectFullPageSnapshot(page, `assistant-${locale.id}-mode-${mode.label}-full-page.png`);
                await expectVisualSnapshot(page.getByTestId('quick-modes-bar'), `assistant-${locale.id}-quick-mode-${mode.label}.png`);
                await expectVisualSnapshot(page.getByTestId('transcript-composer'), `assistant-${locale.id}-composer-${mode.label}.png`);
            });
        }
    }
});
