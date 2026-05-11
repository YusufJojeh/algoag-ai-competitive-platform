import { expect, type Locator, type Page } from '@playwright/test';

type AppThemeTokens = Record<string, string>;

const TOKEN_NAMES = [
    '--app-background',
    '--app-background-elevated',
    '--app-background-muted',
    '--app-border',
    '--app-border-strong',
    '--app-foreground',
    '--app-muted',
    '--app-muted-strong',
    '--app-accent',
    '--app-accent-soft',
    '--app-accent-strong',
] as const;

export async function readThemeTokens(page: Page): Promise<AppThemeTokens> {
    return page.evaluate((tokenNames) => {
        const style = getComputedStyle(document.documentElement);
        return tokenNames.reduce<Record<string, string>>((accumulator, tokenName) => {
            accumulator[tokenName] = style.getPropertyValue(tokenName).trim();
            return accumulator;
        }, {});
    }, [...TOKEN_NAMES]);
}

export async function expectCssVarValue(page: Page, variableName: string, expected: string) {
    const value = await page.evaluate((token) => getComputedStyle(document.documentElement).getPropertyValue(token).trim(), variableName);
    expect(value).toBe(expected);
}

export async function resolveCssVarColor(page: Page, variableName: string, property: 'color' | 'backgroundColor' | 'borderColor' = 'color') {
    return page.evaluate(({ token, styleProperty }) => {
        const probe = document.createElement('div');
        probe.style.position = 'fixed';
        probe.style.opacity = '0';
        probe.style.pointerEvents = 'none';

        if (styleProperty === 'backgroundColor') {
            probe.style.backgroundColor = `var(${token})`;
        } else if (styleProperty === 'borderColor') {
            probe.style.border = `1px solid var(${token})`;
        } else {
            probe.style.color = `var(${token})`;
        }

        document.body.appendChild(probe);
        const value = getComputedStyle(probe)[styleProperty];
        probe.remove();
        return value;
    }, { token: variableName, styleProperty: property });
}

export async function expectElementStyle(locator: Locator, styles: Partial<CSSStyleDeclaration>) {
    const computed = await locator.evaluate((element, expectedStyles) => {
        const style = getComputedStyle(element);
        return Object.fromEntries(
            Object.keys(expectedStyles).map((key) => [key, style[key as keyof CSSStyleDeclaration]])
        );
    }, styles);

    Object.entries(styles).forEach(([key, value]) => {
        expect(computed[key]).toBe(value);
    });
}

export async function readElementStyles(locator: Locator, properties: Array<keyof CSSStyleDeclaration>) {
    return locator.evaluate((element, styleProperties) => {
        const style = getComputedStyle(element);

        return styleProperties.reduce<Record<string, string>>((accumulator, property) => {
            accumulator[property] = style[property];
            return accumulator;
        }, {});
    }, properties);
}
