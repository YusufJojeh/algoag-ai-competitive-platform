import { describe, it, expect, vi, beforeAll } from 'vitest';

const mockCreateInertiaApp = vi.fn();
const mockCreateRoot = vi.fn().mockReturnValue({ render: vi.fn() });
vi.mock('@inertiajs/react', () => ({
    createInertiaApp: (config) => mockCreateInertiaApp(config),
}));
vi.mock('react-dom/client', () => ({
    createRoot: (el) => mockCreateRoot(el),
}));

describe('app.jsx', () => {
    let appConfig;

    beforeAll(async () => {
        vi.clearAllMocks();
        await import('./app.jsx');
        expect(mockCreateInertiaApp).toHaveBeenCalledTimes(1);
        appConfig = mockCreateInertiaApp.mock.calls[0][0];
    });

    it('calls createInertiaApp with resolve and setup', () => {
        expect(appConfig).toHaveProperty('resolve');
        expect(appConfig).toHaveProperty('setup');
        expect(typeof appConfig.resolve).toBe('function');
        expect(typeof appConfig.setup).toBe('function');
    });

    it('resolve returns module default for existing page', async () => {
        const page = await appConfig.resolve('Home');
        expect(page).toBeDefined();
        expect(typeof page).toBe('function');
    });

    it('resolve throws for non-existent page', async () => {
        await expect(appConfig.resolve('NonExistentPage')).rejects.toThrow('Page not found');
    });

    it('setup calls createRoot with el and render', () => {
        const el = document.createElement('div');
        const App = () => null;
        const props = {};
        appConfig.setup({ el, App, props });
        expect(mockCreateRoot).toHaveBeenCalledWith(el);
    });
});
