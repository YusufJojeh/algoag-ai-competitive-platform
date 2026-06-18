import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./resources/js/test/setup.js'],
        include: ['resources/js/**/*.test.{js,jsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'text-summary', 'html', 'lcov'],
            include: ['resources/js/Pages/**/*.jsx'],
            exclude: ['resources/js/test/**', '**/*.test.*', '**/node_modules/**', 'resources/js/app.jsx'],
            thresholds: {
                lines: 100,
                statements: 100,
                branches: 100,
                functions: 100,
            },
        },
    },
});
