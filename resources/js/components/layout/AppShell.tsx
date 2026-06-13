import { type ReactNode, useState } from 'react';
import { PanelLeftOpen } from 'lucide-react';

import AppSidebar from '@/components/layout/AppSidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useUiLocale } from '@/lib/ui-locale';

type AppShellProps = {
    currentPath: string;
    user?: {
        name: string;
        email?: string;
        is_admin?: boolean;
    } | null;
    onLogout: () => void;
    renderHeader: (context: { openSidebar: () => void }) => ReactNode;
    children: ReactNode;
    contextPanel?: ReactNode;
};

export default function AppShell({
    currentPath,
    user,
    onLogout,
    renderHeader,
    children,
    contextPanel,
}: AppShellProps) {
    const { locale } = useUiLocale();
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const hasContextPanel = Boolean(contextPanel);

    return (
        <div className="app-shell-bg min-h-screen p-4 text-[var(--app-foreground)] lg:p-5" data-testid="app-shell">
            <div className={`grid min-h-[calc(100vh-2rem)] gap-4 ${hasContextPanel ? 'xl:grid-cols-[140px_minmax(0,1fr)] 2xl:grid-cols-[140px_minmax(0,1fr)_420px]' : 'xl:grid-cols-[140px_minmax(0,1fr)]'}`}>
                <aside className="hidden xl:block">
                    <AppSidebar currentPath={currentPath} user={user} onLogout={onLogout} />
                </aside>

                <div className="flex min-h-0 flex-col gap-4">
                    <div className="xl:hidden">
                        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
                            <SheetTrigger asChild>
                                <Button type="button" variant="surface" className="rounded-2xl" data-testid="mobile-navigation-trigger">
                                    <PanelLeftOpen className="h-4 w-4" />
                                    {locale === 'ar' ? 'التنقل' : 'Navigation'}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[320px] max-w-[85vw] border-white/10 bg-slate-950/96 p-0 text-[var(--app-foreground)]">
                                <SheetHeader className="sr-only">
                                    <SheetTitle>{locale === 'ar' ? 'التنقل' : 'Navigation'}</SheetTitle>
                                    <SheetDescription>{locale === 'ar' ? 'تنقل داخل مساحة العمل.' : 'Navigate inside the workspace.'}</SheetDescription>
                                </SheetHeader>
                                <div className="h-full p-4">
                                    <AppSidebar currentPath={currentPath} user={user} onLogout={onLogout} />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <section className="app-surface-strong flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[34px]">
                        {renderHeader({ openSidebar: () => setMobileSidebarOpen(true) })}
                        <div className="min-h-0 flex-1">{children}</div>
                    </section>
                </div>

                {hasContextPanel ? <div className="min-h-0 xl:col-start-2 2xl:col-start-auto">{contextPanel}</div> : null}
            </div>
        </div>
    );
}
