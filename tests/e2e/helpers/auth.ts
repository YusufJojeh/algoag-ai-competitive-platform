import { expect, type APIRequestContext, type Page } from '@playwright/test';

import type { TestLocale } from './locale';
import { buildRuntimeRoute } from './routes';

type AuthFixture = {
    email: string;
    password: string;
};

/**
 * Secret shared with the Laravel /__e2e/runtime/* gate.
 * Must match the E2E_FIXTURE_SECRET env var on the server.
 * Falls back to the phpunit value if not set, which matches the
 * default Playwright server boot for local development.
 */
const E2E_SECRET = process.env.E2E_FIXTURE_SECRET ?? 'phpunit-e2e-secret';

const SECRET_HEADERS = { 'X-E2E-Secret': E2E_SECRET };

export async function provisionAuthFixture(request: APIRequestContext): Promise<AuthFixture> {
    const response = await request.get('/__e2e/runtime/auth/fixture', {
        headers: SECRET_HEADERS,
    });
    expect(response.ok()).toBeTruthy();
    return response.json();
}

export async function loginThroughUi(page: Page, request: APIRequestContext, locale: TestLocale) {
    await provisionAuthFixture(request);
    const loginResponse = await page.context().request.post(`/__e2e/runtime/auth/login?ui_locale=${locale}`, {
        headers: SECRET_HEADERS,
    });
    expect(loginResponse.ok()).toBeTruthy();

    await page.goto(`/assistant?ui_locale=${locale}`, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/assistant/);
}
