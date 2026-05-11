export type VisualPageName = 'landing' | 'login' | 'assistant';
export type RuntimePageName = 'landing' | 'login' | 'assistant' | 'dashboard' | 'problems' | 'courses';

export type UiLocale = 'ar' | 'en';

export function buildVisualRoute(pageName: VisualPageName, params: Record<string, string | undefined> = {}) {
    const search = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value) {
            search.set(key, value);
        }
    });

    const query = search.toString();

    return `/__e2e/visual/${pageName}${query ? `?${query}` : ''}`;
}

export function buildRuntimeRoute(pageName: RuntimePageName, params: Record<string, string | undefined> = {}) {
    const search = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value) {
            search.set(key, value);
        }
    });

    const query = search.toString();
    const pathname = pageName === 'landing' ? '/' : `/${pageName}`;

    return `${pathname}${query ? `?${query}` : ''}`;
}
