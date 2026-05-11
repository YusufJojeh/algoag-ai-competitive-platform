import { test } from '@playwright/test';

import { LOCALES } from '../helpers/locale';
import { expectFullPageSnapshot, expectVisualSnapshot, gotoVisualPage } from '../helpers/visual';

test.describe('Assistant history and conversation visuals', () => {
    for (const locale of LOCALES) {
        test(`long conversation thread remains stable in ${locale.id}`, async ({ page }, testInfo) => {
            test.skip(!['desktop-1440', 'tablet-768'].includes(testInfo.project.name));

            await gotoVisualPage(page, 'assistant', { scenario: 'history' }, locale.id);
            await expectFullPageSnapshot(page, `assistant-${locale.id}-history-full-page.png`);
            await expectVisualSnapshot(page.getByTestId('assistant-thread'), `assistant-${locale.id}-history-thread.png`);
        });

        test(`live context timeline remains stable in ${locale.id}`, async ({ page }, testInfo) => {
            test.skip(!['desktop-1440', 'tablet-768'].includes(testInfo.project.name));

            await gotoVisualPage(page, 'assistant', { scenario: 'history' }, locale.id);
            await expectVisualSnapshot(page.getByTestId('screen-context-panel'), `assistant-${locale.id}-history-context-panel.png`);
        });
    }
});
