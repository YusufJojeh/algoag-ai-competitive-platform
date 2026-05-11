import { test } from '@playwright/test';

import { loginVisualStates } from '../fixtures/login';
import { LOCALES } from '../helpers/locale';
import { expectFullPageSnapshot, gotoVisualPage } from '../helpers/visual';

test.describe('Login visual regression', () => {
    for (const locale of LOCALES) {
        for (const state of loginVisualStates) {
            test(`login page renders "${state}" state consistently in ${locale.id}`, async ({ page }) => {
                await gotoVisualPage(page, 'login', state === 'default' ? {} : { scenario: state }, locale.id);
                await expectFullPageSnapshot(page, `login-${locale.id}-${state}-full-page.png`);
            });
        }
    }
});
