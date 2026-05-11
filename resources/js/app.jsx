import './bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import React from 'react';

import { UiLocaleProvider } from '@/lib/ui-locale';

createInertiaApp({
    progress: {
        color: '#34d399', // emerald-400 — matches app accent
        showSpinner: false,
    },
    resolve: async (name) => {
        const jsxPages = import.meta.glob('./Pages/**/*.jsx', { eager: false });
        const tsxPages = import.meta.glob('./Pages/**/*.tsx', { eager: false });
        const pages = { ...jsxPages, ...tsxPages };
        const page = pages[`./Pages/${name}.jsx`] ?? pages[`./Pages/${name}.tsx`];

        if (!page) throw new Error(`Page not found: ${name}`);

        const mod = await page();
        return mod.default;
    },
    setup({ el, App, props }) {
        const ui = props.initialPage.props.ui ?? {};

        createRoot(el).render(
            <UiLocaleProvider locale={ui.locale} dir={ui.dir}>
                <App {...props} />
            </UiLocaleProvider>
        );
    },
});
