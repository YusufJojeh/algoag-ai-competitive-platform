import { expect, test } from '@playwright/test';

import { loginThroughUi } from '../helpers/auth';
import { readThemeTokens, readElementStyles, resolveCssVarColor } from '../helpers/design';
import { expectDirection, expectLocalizedTexts, expectNoRawTranslationArtifacts } from '../helpers/i18n';
import { LOCALES } from '../helpers/locale';
import { buildRuntimeRoute } from '../helpers/routes';

test.describe('Assistant shell runtime coverage', () => {
    for (const locale of LOCALES) {
        test(`assistant shell loads with correct navigation in ${locale.id}`, async ({ page, request }) => {
            await loginThroughUi(page, request, locale.id);
            await page.goto(buildRuntimeRoute('assistant', { ui_locale: locale.id }), { waitUntil: 'networkidle' });

            await expect(page.getByTestId('assistant-workspace-shell')).toBeVisible();
            await expect(page.getByTestId('app-shell')).toBeVisible();
            await expect(page.getByTestId('app-sidebar')).toBeVisible();
            await expect(page.getByTestId('screen-context-panel')).toBeVisible();
            await expect(page.getByTestId('quick-modes-bar')).toBeVisible();
            await expect(page.getByTestId('transcript-composer')).toBeVisible();
            await expectDirection(page, locale.dir);
            await expectNoRawTranslationArtifacts(page);

            await expectLocalizedTexts(page.getByTestId('assistant-workspace-shell'), locale.id === 'ar'
                ? ['مساحة المساعد الصوتي والبصري', 'أنماط المساعدة', 'ابدأ جلسة تحليل جديدة', 'ابدأ مشاركة الشاشة']
                : ['Voice and Vision assistant workspace', 'Assistant modes', 'Start a new analysis session', 'Start screen sharing']);

            const tokens = await readThemeTokens(page);
            expect(tokens['--app-foreground']).not.toBe('');
            const shellStyles = await readElementStyles(page.getByTestId('app-shell'), ['color']);
            expect(shellStyles.color).toBe(await resolveCssVarColor(page, '--app-foreground'));

            await page.getByRole('link', { name: locale.id === 'ar' ? 'المسائل' : 'Problems' }).click();
            await expect(page).toHaveURL(/\/problems/);

            await page.goto(buildRuntimeRoute('assistant', { ui_locale: locale.id }), { waitUntil: 'networkidle' });
            await page.getByRole('link', { name: locale.id === 'ar' ? 'المسارات' : 'Courses' }).click();
            await expect(page).toHaveURL(/\/courses/);
        });
    }
});
