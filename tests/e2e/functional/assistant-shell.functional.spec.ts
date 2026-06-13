import { expect, test } from '@playwright/test';

import { loginThroughUi } from '../helpers/auth';
import { readElementStyles, readThemeTokens, resolveCssVarColor } from '../helpers/design';
import { expectDirection, expectLocalizedTexts, expectNoRawTranslationArtifacts } from '../helpers/i18n';
import { LOCALES } from '../helpers/locale';
import { buildRuntimeRoute } from '../helpers/routes';

const requiredModeValues = [
    'topic_explanation',
    'topic_recommendation',
    'hint',
    'idea_check',
    'logic_critique',
    'edge_cases',
    'complexity',
    'full_solution',
    'step_by_step_solution',
    'approach_compare',
    'common_mistakes',
    'solve',
    'generate_code',
    'generate_tests',
    'verify_code',
    'debug_wrong_answer',
    'wrong',
    'summarize',
    'next_step',
];

test.describe('Assistant shell runtime coverage', () => {
    for (const locale of LOCALES) {
        test(`assistant shell loads with correct navigation in ${locale.id}`, async ({ page, request }, testInfo) => {
            await loginThroughUi(page, request, locale.id);
            await page.goto(buildRuntimeRoute('assistant', { ui_locale: locale.id }), { waitUntil: 'networkidle' });

            await expect(page.getByTestId('assistant-workspace-shell')).toBeVisible();
            await expect(page.getByTestId('app-shell')).toBeVisible();
            const hasPersistentSidebar = ['desktop-1440', 'laptop-1280'].includes(testInfo.project.name);

            if (hasPersistentSidebar) {
                await expect(page.getByTestId('app-sidebar')).toBeVisible();
            } else {
                await expect(page.getByTestId('mobile-navigation-trigger')).toBeVisible();
            }

            await expect(page.getByTestId('screen-context-panel')).toBeVisible();
            await expect(page.getByTestId('quick-modes-bar')).toBeVisible();
            await expect(page.getByTestId('transcript-composer')).toBeVisible();
            await expectDirection(page, locale.dir);
            await expectNoRawTranslationArtifacts(page);

            const modeSelect = page.getByTestId('assistant-mode-select');
            await expect(modeSelect).toBeVisible();
            await expect(modeSelect).toHaveAccessibleName(locale.id === 'ar' ? 'نمط المساعد' : 'Assistant mode');
            const modeValues = await modeSelect.locator('option').evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
            expect(modeValues).toEqual(expect.arrayContaining(requiredModeValues));
            await modeSelect.selectOption('debug_wrong_answer');
            await expect(modeSelect).toHaveValue('debug_wrong_answer');

            await expectLocalizedTexts(page.getByTestId('assistant-workspace-shell'), locale.id === 'ar'
                ? ['مساحة المساعد الصوتي والبصري', 'نمط المساعد', 'اشرح الإجابة الخاطئة', 'ابدأ جلسة تحليل جديدة']
                : ['Voice and Vision assistant workspace', 'Assistant mode', 'Debug wrong answer', 'Start a new analysis session']);

            const tokens = await readThemeTokens(page);
            expect(tokens['--app-foreground']).not.toBe('');
            const shellStyles = await readElementStyles(page.getByTestId('app-shell'), ['color']);
            expect(shellStyles.color).toBe(await resolveCssVarColor(page, '--app-foreground'));

            if (!hasPersistentSidebar) {
                await page.getByTestId('mobile-navigation-trigger').click();
            }
            await page.getByRole('link', { name: locale.id === 'ar' ? 'المسائل' : 'Problems' }).click();
            await expect(page).toHaveURL(/\/problems/);

            await page.goto(buildRuntimeRoute('assistant', { ui_locale: locale.id }), { waitUntil: 'networkidle' });
            if (!hasPersistentSidebar) {
                await page.getByTestId('mobile-navigation-trigger').click();
            }
            await page.getByRole('link', { name: locale.id === 'ar' ? 'المسارات' : 'Courses' }).click();
            await expect(page).toHaveURL(/\/courses/);
        });
    }
});
