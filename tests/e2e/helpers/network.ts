import type { Page, Route } from '@playwright/test';

type MockJsonResponse = Record<string, unknown>;

export async function mockAssistantAnalyzeRequest(page: Page, response: MockJsonResponse = {}) {
    await page.route('**/assistant/analyze', async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                session_id: 777,
                message_id: 888,
                status: 'queued',
                ...response,
            }),
        });
    });
}

export async function mockAssistantStatusSequence(page: Page, sequence: MockJsonResponse[]) {
    let cursor = 0;

    await page.route('**/assistant/messages/*/status', async (route: Route) => {
        const nextResponse = sequence[Math.min(cursor, sequence.length - 1)];
        cursor += 1;

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(nextResponse),
        });
    });
}

export async function blockRealtimeNoise(page: Page) {
    await page.route('**/broadcasting/auth', async (route: Route) => route.abort());
    await page.route('**/app/**/events', async (route: Route) => route.abort());
}
