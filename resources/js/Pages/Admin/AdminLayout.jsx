import { Link } from '@inertiajs/react';
import { BarChart3, Database, Languages, Settings, Trophy, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useUiLocale } from '@/lib/ui-locale';

export const adminCopy = {
    en: {
        brand: 'ALGOAG',
        section: 'Administration',
        dashboard: 'Dashboard',
        problems: 'Problems',
        contests: 'Contests',
        users: 'Users',
        settings: 'Settings',
        backToWorkspace: 'Workspace',
        switchLanguage: 'العربية',
        openNavigation: 'Open navigation',
        closeNavigation: 'Close navigation',
    },
    ar: {
        brand: 'ALGOAG',
        section: 'الإدارة',
        dashboard: 'لوحة التحكم',
        problems: 'المسائل',
        contests: 'المسابقات',
        users: 'المستخدمون',
        settings: 'الإعدادات',
        backToWorkspace: 'مساحة العمل',
        switchLanguage: 'English',
        openNavigation: 'افتح التنقل',
        closeNavigation: 'أغلق التنقل',
    },
};

const navItems = [
    { href: '/admin', labelKey: 'dashboard', icon: BarChart3 },
    { href: '/admin/problems', labelKey: 'problems', icon: Database },
    { href: '/admin/contests', labelKey: 'contests', icon: Trophy },
    { href: '/admin/users', labelKey: 'users', icon: Users },
    { href: '/admin/settings', labelKey: 'settings', icon: Settings },
];

export default function AdminLayout({ title, subtitle, badge, actions, children }) {
    const { locale, dir, isRtl, switchHref } = useUiLocale();
    const copy = adminCopy[locale];
    const currentPath = typeof window !== 'undefined' ? window.location.pathname.replace(/\/$/, '') || '/admin' : '/admin';
    const nextLocale = locale === 'ar' ? 'en' : 'ar';

    return (
        <div className="app-shell-bg min-h-screen p-4 text-[var(--app-foreground)] lg:p-5" dir={dir} lang={locale}>
            <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col gap-4 xl:grid xl:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="app-surface-strong hidden min-h-0 rounded-[34px] p-5 xl:flex xl:flex-col">
                    <AdminNav copy={copy} currentPath={currentPath} isRtl={isRtl} />
                    <div className="mt-auto flex flex-col gap-3">
                        <Separator />
                        <Button asChild variant="surface" size="sm">
                            <Link href={switchHref(nextLocale)}>
                                <Languages data-icon="inline-start" />
                                {copy.switchLanguage}
                            </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/assistant">{copy.backToWorkspace}</Link>
                        </Button>
                    </div>
                </aside>

                <section className="app-surface-strong flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[34px]">
                    <header className="border-b border-[var(--app-border)] bg-slate-950/80 px-5 py-5 backdrop-blur md:px-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="app">{badge ?? copy.section}</Badge>
                                    <span className="text-xs text-[var(--app-muted)]">{copy.brand}</span>
                                </div>
                                <h1 className="mt-3 text-2xl font-semibold leading-tight text-[var(--app-foreground)] md:text-3xl">{title}</h1>
                                {subtitle ? <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--app-muted-strong)]">{subtitle}</p> : null}
                            </div>
                            {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
                        </div>

                        <nav className="mt-5 flex gap-2 overflow-x-auto xl:hidden" aria-label={copy.section}>
                            {navItems.map((item) => {
                                const active = isActivePath(currentPath, item.href);

                                return (
                                    <Button key={item.href} asChild variant={active ? 'default' : 'surface'} size="sm">
                                        <Link href={item.href}>{copy[item.labelKey]}</Link>
                                    </Button>
                                );
                            })}
                        </nav>
                    </header>

                    <main className="min-h-0 flex-1 overflow-auto px-5 py-6 md:px-6">{children}</main>
                </section>
            </div>
        </div>
    );
}

function AdminNav({ copy, currentPath, isRtl }) {
    return (
        <div className="flex min-h-0 flex-col">
            <Link href="/assistant" className="group flex items-center gap-3 rounded-[28px] border border-[var(--app-border)] bg-slate-950/45 p-4 transition hover:border-[var(--app-border-strong)]">
                <div className="flex size-12 items-center justify-center rounded-[20px] border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                    <BarChart3 className="size-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--app-muted)]">{copy.brand}</p>
                    <p className="truncate text-sm font-semibold text-[var(--app-foreground)]">{copy.section}</p>
                </div>
            </Link>

            <nav className="mt-6 flex flex-col gap-2" aria-label={copy.section}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActivePath(currentPath, item.href);

                    return (
                        <Button key={item.href} asChild variant="sidebar" size="sidebar" className={cn(active && 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100')}>
                            <Link href={item.href} className={cn(isRtl && 'flex-row-reverse')}>
                                <Icon data-icon="inline-start" />
                                <span>{copy[item.labelKey]}</span>
                            </Link>
                        </Button>
                    );
                })}
            </nav>
        </div>
    );
}

function isActivePath(currentPath, href) {
    return currentPath === href || (href !== '/admin' && currentPath.startsWith(href));
}
