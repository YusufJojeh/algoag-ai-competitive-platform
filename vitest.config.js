import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['resources/js/test/setup.js'],
        include: ['resources/js/**/*.test.{js,jsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['resources/js/Pages/**/*.jsx', 'resources/js/app.jsx'],
            exclude: ['resources/js/test/**', '**/*.test.*', '**/node_modules/**'],
        },
    },
});
