import type { ReactNode } from 'react';
import { useForm, usePage } from '@inertiajs/react';

import AppShell from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUiLocale } from '@/lib/ui-locale';

type AppLayoutProps = {
    children: ReactNode;
    contextPanel?: ReactNode;
    renderHeader?: (context: { openSidebar: () => void }) => ReactNode;
    title?: string;
    description?: string;
    badge?: string | null;
    actions?: ReactNode;
    currentPath?: string;
    contentClassName?: string;
};

type LayoutPageProps = {
    auth?: {
        user?: {
            id: number;
            name: string;
            email: string;
            is_admin: boolean;
        } | null;
    };
};

export default function AppLayout({
    children,
    contextPanel,
    renderHeader,
    title,
    description,
    badge = null,
    actions = null,
    currentPath,
    contentClassName,
}: AppLayoutProps) {
    const page = usePage<LayoutPageProps>();
    const logoutForm = useForm({});
    const { locale } = useUiLocale();

    const resolvedPath = currentPath ?? (typeof window !== 'undefined' ? window.location.pathname : '/assistant');

    return (
        <AppShell
            currentPath={resolvedPath}
            user={page.props.auth?.user}
            onLogout={() => logoutForm.post('/logout')}
            renderHeader={renderHeader ?? (({ openSidebar }) => (
                <div className="sticky top-0 z-20 border-b border-[var(--app-border)] bg-slate-950/85 px-6 py-5 backdrop-blur">
                    <div className="mx-auto flex w-full max-w-5xl items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <Button type="button" variant="surface" size="icon" className="xl:hidden" onClick={openSidebar}>
                                <span className="sr-only">{locale === 'ar' ? 'افتح التنقل' : 'Open navigation'}</span>
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                                </svg>
                            </Button>
                            <div>
                                {badge ? <Badge variant="app">{badge}</Badge> : null}
                                {title ? <h1 className="mt-2 text-2xl font-semibold text-[var(--app-foreground)]">{title}</h1> : null}
                                {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--app-muted)]">{description}</p> : null}
                            </div>
                        </div>
                        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
                    </div>
                </div>
            ))}
            contextPanel={contextPanel}
        >
            <div className={contentClassName}>{children}</div>
        </AppShell>
    );
}
