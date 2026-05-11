import { test } from '@playwright/test';

import { assistantVisualStates } from '../fixtures/assistant';
import { LOCALES } from '../helpers/locale';
import { expectFullPageSnapshot, gotoVisualPage } from '../helpers/visual';

test.describe('Assistant visual states', () => {
    for (const locale of LOCALES) {
        for (const state of assistantVisualStates) {
            test(`assistant state "${state}" remains visually stable in ${locale.id}`, async ({ page }, testInfo) => {
                test.skip(testInfo.project.name !== 'desktop-1440', 'State matrix is captured on the canonical desktop viewport.');
                await gotoVisualPage(page, 'assistant', { scenario: state }, locale.id);
                await expectFullPageSnapshot(page, `assistant-state-${locale.id}-${state}-full-page.png`);
            });
        }
    }
});
