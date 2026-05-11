import { expect, test } from '@playwright/test';

import { expectDirection, expectLocalizedTexts, expectNoRawTranslationArtifacts } from '../helpers/i18n';
import { LOCALES } from '../helpers/locale';
import { gotoVisualPage } from '../helpers/visual';

const scenarioAssertions = {
    empty: {
        ar: ['ابدأ جلسة تحليل جديدة', 'بانتظار الإطار'],
        en: ['Start a new analysis session', 'Waiting for frame'],
    },
    analyzing: {
        ar: ['تحليل السياق', 'قيد تحليل النمط'],
        en: ['Analyzing context', 'Pattern analysis in progress'],
    },
    failed: {
        ar: ['تعذر إكمال الدورة الحالية', 'تعذر إكمال التحليل حالياً. حاول مرة أخرى بعد إعادة الاتصال.'],
        en: ['Current run failed', 'The analysis could not be completed right now. Try again after reconnecting.'],
    },
    completed: {
        ar: ['اكتمل الرد', 'لخص لي الخطوة التالية فقط.'],
        en: ['Reply completed', 'Summarize only the next step for me.'],
    },
    history: {
        ar: ['تم تحديد جلسة سابقة', 'اختبر مصفوفة بطول 0 أو 1'],
        en: ['Previous session selected', 'Test arrays of length 0 or 1'],
    },
} as const;

test.describe('Assistant seeded state coverage', () => {
    for (const locale of LOCALES) {
        for (const scenario of Object.keys(scenarioAssertions) as Array<keyof typeof scenarioAssertions>) {
            test(`assistant state "${scenario}" is localized in ${locale.id}`, async ({ page }) => {
                await gotoVisualPage(page, 'assistant', { scenario }, locale.id);

                await expect(page.getByTestId('assistant-workspace-shell')).toBeVisible();
                await expectDirection(page, locale.dir);
                await expectNoRawTranslationArtifacts(page);
                await expectLocalizedTexts(page.getByTestId('assistant-workspace-shell'), scenarioAssertions[scenario][locale.id]);
            });
        }
    }
});
