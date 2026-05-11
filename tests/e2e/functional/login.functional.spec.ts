import { expect, test } from '@playwright/test';

import { loginThroughUi } from '../helpers/auth';
import { readThemeTokens, readElementStyles, resolveCssVarColor } from '../helpers/design';
import { expectDirection, expectLocalizedTexts, expectNoRawTranslationArtifacts } from '../helpers/i18n';
import { LOCALES } from '../helpers/locale';
import { gotoRuntimePage } from '../helpers/visual';

test.describe('Login flow runtime coverage', () => {
    for (const locale of LOCALES) {
        test(`login page renders localized form in ${locale.id}`, async ({ page }) => {
            await gotoRuntimePage(page, 'login', {}, locale.id);

            await expect(page.getByTestId('login-page')).toBeVisible();
            await expectDirection(page, locale.dir);
            await expectNoRawTranslationArtifacts(page);

            await expectLocalizedTexts(page.getByTestId('login-page'), locale.id === 'ar'
                ? ['مرحباً بعودتك', 'البريد الإلكتروني', 'كلمة المرور', 'دخول إلى المساحة']
                : ['Welcome back', 'Email', 'Password', 'Enter workspace']);

            const tokens = await readThemeTokens(page);
            expect(tokens['--app-accent']).not.toBe('');
            expect(tokens['--app-border']).not.toBe('');

            const submitStyles = await readElementStyles(
                page.getByRole('button', { name: locale.id === 'ar' ? 'دخول إلى المساحة' : 'Enter workspace' }),
                ['backgroundColor', 'color']
            );

            expect(submitStyles.backgroundColor).toBe(await resolveCssVarColor(page, '--app-accent', 'backgroundColor'));
            expect(submitStyles.color).toBe('rgb(255, 255, 255)');
        });

        test(`deterministic auth fixture reaches assistant in ${locale.id}`, async ({ page, request }) => {
            await loginThroughUi(page, request, locale.id);
            await expect(page.getByTestId('assistant-workspace-shell')).toBeVisible();
        });
    }
});
