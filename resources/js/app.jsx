import './bootstrap';

// Self-hosted UI typeface: IBM Plex Sans Arabic covers Arabic + Latin from one
// coherent family, so the bilingual (ar/en) UI never falls back to system-ui for
// Arabic. Subsetted via unicode-range, so non-Arabic visitors don't pay for it.
import '@fontsource/ibm-plex-sans-arabic/300.css';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';

import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import React from 'react';

import LanguageSwitch from '@/components/layout/LanguageSwitch';
import { UiLocaleProvider } from '@/lib/ui-locale';

createInertiaApp({
    progress: {
        color: '#34d399',
        showSpinner: false,
    },
    resolve: async (name) => {
        const jsxPages = import.meta.glob(['./Pages/**/*.jsx', '!./Pages/**/*.test.jsx'], { eager: false });
        const tsxPages = import.meta.glob(['./Pages/**/*.tsx', '!./Pages/**/*.test.tsx'], { eager: false });
        const pages = { ...jsxPages, ...tsxPages };
        const page = pages[`./Pages/${name}.jsx`] ?? pages[`./Pages/${name}.tsx`];

        if (!page) throw new Error(`Page not found: ${name}`);

        const mod = await page();
        return mod.default;
    },
    setup({ el, App, props }) {
        const ui = props.initialPage?.props?.ui ?? {};

        createRoot(el).render(
            <UiLocaleProvider locale={ui.locale} dir={ui.dir}>
                <LanguageSwitch />
                <App {...props} />
            </UiLocaleProvider>,
        );
    },
});
