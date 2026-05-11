import { defineConfig, devices } from '@playwright/test';

const isCi = Boolean(process.env.CI);
const localChannel = process.env.PLAYWRIGHT_CHANNEL ?? (!isCi ? 'chrome' : undefined);
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: isCi,
    retries: isCi ? 2 : 0,
    workers: isCi ? 2 : undefined,
    timeout: 45_000,
    reporter: isCi
        ? [['dot'], ['html', { open: 'never' }]]
        : [['list'], ['html', { open: 'never' }]],
    snapshotPathTemplate: '{testDir}/__snapshots__/{projectName}/{testFilePath}/{arg}{ext}',
    expect: {
        toHaveScreenshot: {
            animations: 'disabled',
            caret: 'hide',
            maxDiffPixelRatio: 0.01,
            scale: 'css',
        },
    },
    use: {
        baseURL: 'http://127.0.0.1:8000',
        locale: 'en-US',
        timezoneId: 'UTC',
        colorScheme: 'light',
        reducedMotion: 'reduce',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'off',
    },
    projects: [
        {
            name: 'desktop-1440',
            use: {
                ...devices['Desktop Chrome'],
                channel: localChannel,
                viewport: { width: 1440, height: 1280 },
            },
        },
        {
            name: 'laptop-1280',
            use: {
                ...devices['Desktop Chrome'],
                channel: localChannel,
                viewport: { width: 1280, height: 1100 },
            },
        },
        {
            name: 'tablet-768',
            use: {
                ...devices['Desktop Chrome'],
                channel: localChannel,
                viewport: { width: 768, height: 1024 },
                hasTouch: true,
                isMobile: false,
            },
        },
        {
            name: 'mobile-390',
            use: {
                browserName: 'chromium',
                channel: localChannel,
                viewport: { width: 390, height: 844 },
                isMobile: true,
                hasTouch: true,
            },
        },
    ],
    webServer: skipWebServer
        ? undefined
        : [
              {
                  command: 'npm run dev -- --host 127.0.0.1 --port 5174',
                  url: 'http://127.0.0.1:5174',
                  reuseExistingServer: !isCi,
                  timeout: 120_000,
              },
              {
                  command: 'php artisan serve --host=127.0.0.1 --port=8000',
                  url: 'http://127.0.0.1:8000',
                  reuseExistingServer: !isCi,
                  timeout: 120_000,
                  env: {
                      ...process.env,
                      APP_URL: 'http://127.0.0.1:8000',
                      BROADCAST_CONNECTION: 'log',
                      CACHE_STORE: 'file',
                      SESSION_DRIVER: 'file',
                  },
              },
          ],
});
