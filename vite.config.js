import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    server: {
        host: process.env.VITE_DEV_SERVER_HOST ?? '127.0.0.1',
        port: Number(process.env.VITE_DEV_SERVER_PORT ?? 5173),
        strictPort: false,
        hmr: {
            host: process.env.VITE_HMR_HOST ?? '127.0.0.1',
            protocol: process.env.VITE_HMR_PROTOCOL ?? 'ws',
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});
