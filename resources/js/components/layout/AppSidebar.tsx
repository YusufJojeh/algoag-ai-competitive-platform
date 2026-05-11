import { Link } from '@inertiajs/react';
import { ChevronLeft, CircleHelp, ExternalLink, LogOut, Shield } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getSidebarPrimaryItems, getSidebarUtilityItems } from '@/lib/assistant-workspace';
import { useUiLocale } from '@/lib/ui-locale';

type AppSidebarProps = {
    currentPath: string;
    user?: {
        name: string;
        email?: string;
        is_admin?: boolean;
    } | null;
    onLogout: () => void;
};

export default function AppSidebar({ currentPath, user, onLogout }: AppSidebarProps) {
    const { locale, isRtl } = useUiLocale();
    const sidebarPrimaryItems = getSidebarPrimaryItems(locale);
    const sidebarUtilityItems = getSidebarUtilityItems(locale);

    return (
        <TooltipProvider delayDuration={100}>
            <div className="app-surface-strong flex h-full min-h-[calc(100vh-2rem)] flex-col justify-between rounded-[32px] px-4 py-5" data-testid="app-sidebar">
                <div className="space-y-5">
                    <div className="space-y-4">
                        <div className="flex items-center justify-center">
                            <Link href="/assistant" className="flex flex-col items-center gap-3 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/10 bg-white/6 text-cyan-200 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
                                    <ChevronLeft className={`h-5 w-5 ${isRtl ? '' : 'rotate-180'}`} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.22em] text-slate-400">ALGOAG</p>
                                    <p className="mt-1 text-sm font-semibold text-[var(--app-foreground)]">
                                        {locale === 'ar' ? 'مساحة التدريب' : 'Practice workspace'}
                                    </p>
                                </div>
                            </Link>
                        </div>

                        <Separator />
                    </div>

                    <nav className="space-y-2">
                        {sidebarPrimaryItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.available && currentPath.startsWith(item.href);

                            const content = (
                                <div className="flex flex-col items-center gap-1.5">
                                    <div
                                        className={[
                                            'flex h-11 w-11 items-center justify-center rounded-[18px] border transition',
                                            isActive
                                                ? 'border-cyan-300/25 bg-cyan-400/12 text-cyan-200'
                                                : 'border-transparent bg-transparent text-[var(--app-muted)] group-hover:bg-white/8 group-hover:text-[var(--app-foreground)]',
                                        ].join(' ')}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-[11px] font-medium text-[var(--app-muted-strong)]">{item.label}</span>
                                </div>
                            );

                            return (
                                <Tooltip key={item.id}>
                                    <TooltipTrigger asChild>
                                        <div>
                                            {item.available ? (
                                                <Link href={item.href} className="group block rounded-[24px] p-2 transition hover:bg-white/6">
                                                    {content}
                                                </Link>
                                            ) : (
                                                <button type="button" className="group block w-full rounded-[24px] p-2 opacity-70 transition hover:bg-white/6" disabled>
                                                    {content}
                                                </button>
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                        {item.available ? item.label : `${item.label} ${locale === 'ar' ? 'قريباً' : 'soon'}`}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </nav>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2 rounded-[24px] border border-[var(--app-border)] bg-slate-950/45 p-3">
                        {sidebarUtilityItems.map((item) => (
                            <Link key={item.id} href={item.href} className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm text-[var(--app-muted-strong)] transition hover:bg-white/8 hover:text-[var(--app-foreground)]">
                                <span>{item.label}</span>
                                <ExternalLink className="h-4 w-4" />
                            </Link>
                        ))}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className={`flex w-full items-center gap-3 rounded-[24px] border border-[var(--app-border)] bg-slate-950/55 px-3 py-3 shadow-sm transition hover:border-[var(--app-border-strong)] ${isRtl ? 'text-right' : 'text-left'}`}
                            >
                                <Avatar className="h-11 w-11">
                                    <AvatarFallback>{user?.name?.slice(0, 1) ?? 'A'}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="truncate text-sm font-semibold text-[var(--app-foreground)]">{user?.name ?? (locale === 'ar' ? 'مستخدم' : 'User')}</p>
                                        {user?.is_admin && (
                                            <Badge variant="warning">
                                                <Shield className="h-3.5 w-3.5" />
                                                {locale === 'ar' ? 'مشرف' : 'Admin'}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="truncate text-xs text-[var(--app-muted)]">{user?.email ?? 'assistant@algoag.test'}</p>
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuLabel>{locale === 'ar' ? 'الحساب' : 'Account'}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/assistant">{locale === 'ar' ? 'المساعد' : 'Assistant'}</Link>
                            </DropdownMenuItem>
                            {user?.is_admin && (
                                <DropdownMenuItem asChild>
                                    <Link href="/admin/problems">{locale === 'ar' ? 'إدارة المسائل' : 'Problem admin'}</Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem disabled>
                                <CircleHelp className="h-4 w-4" />
                                {locale === 'ar' ? 'الإعدادات قريباً' : 'Settings soon'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onLogout}>
                                <LogOut className="h-4 w-4" />
                                {locale === 'ar' ? 'تسجيل الخروج' : 'Log out'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </TooltipProvider>
    );
}
