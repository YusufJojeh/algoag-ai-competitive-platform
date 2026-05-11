import { expect, test } from '@playwright/test';

import { readElementStyles, readThemeTokens, resolveCssVarColor } from '../helpers/design';
import { LOCALES } from '../helpers/locale';
import { gotoRuntimePage, gotoVisualPage } from '../helpers/visual';

test.describe('Runtime design consistency', () => {
    for (const locale of LOCALES) {
        test(`landing, login, and assistant share the same app palette in ${locale.id}`, async ({ page }) => {
            await gotoRuntimePage(page, 'landing', {}, locale.id);
            const landingTokens = await readThemeTokens(page);

            await gotoRuntimePage(page, 'login', {}, locale.id);
            const loginTokens = await readThemeTokens(page);
            expect(loginTokens).toEqual(landingTokens);

            await gotoVisualPage(page, 'assistant', { scenario: 'completed' }, locale.id);
            const assistantTokens = await readThemeTokens(page);
            expect(assistantTokens).toEqual(landingTokens);
        });

        test(`interactive surfaces resolve shared accent and foreground tokens in ${locale.id}`, async ({ page }) => {
            await gotoRuntimePage(page, 'login', {}, locale.id);
            const accentColor = await resolveCssVarColor(page, '--app-accent', 'backgroundColor');
            const foregroundColor = await resolveCssVarColor(page, '--app-foreground');
            const loginSubmitStyles = await readElementStyles(
                page.getByRole('button', { name: locale.id === 'ar' ? 'دخول إلى المساحة' : 'Enter workspace' }),
                ['backgroundColor', 'color']
            );

            expect(loginSubmitStyles.backgroundColor).toBe(accentColor);
            expect(loginSubmitStyles.color).toBe('rgb(255, 255, 255)');

            await gotoVisualPage(page, 'assistant', { scenario: 'completed' }, locale.id);
            const shellStyles = await readElementStyles(page.getByTestId('app-shell'), ['color']);
            expect(shellStyles.color).toBe(foregroundColor);

            const assistantSubmitStyles = await readElementStyles(
                page.getByRole('button', { name: locale.id === 'ar' ? 'أرسل للتحليل' : 'Send for analysis' }),
                ['backgroundColor', 'color']
            );
            expect(assistantSubmitStyles.backgroundColor).toBe(accentColor);
            expect(assistantSubmitStyles.color).toBe('rgb(255, 255, 255)');
        });
    }
});
