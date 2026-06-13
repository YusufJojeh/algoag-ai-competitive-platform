import { Link } from '@inertiajs/react';
import { ChevronLeft, CircleHelp, LogOut, Shield } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { getSidebarPrimaryItems } from '@/lib/assistant-workspace';
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
    const ar = locale === 'ar';

    return (
        <TooltipProvider delayDuration={100}>
            <div className="app-surface-strong flex h-full min-h-[calc(100vh-2rem)] flex-col justify-between rounded-[32px] px-3 py-5" data-testid="app-sidebar">
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
                                        {ar ? 'مساحة التدريب' : 'Practice workspace'}
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
                                    <span className="max-w-full text-center text-[11px] font-medium leading-tight text-[var(--app-muted-strong)]">{item.label}</span>
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
                                        {item.available ? item.label : `${item.label} ${ar ? 'قريبا' : 'soon'}`}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </nav>
                </div>

                <div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className={`flex w-full items-center gap-3 rounded-[24px] border border-[var(--app-border)] bg-slate-950/55 px-3 py-3 shadow-sm transition hover:border-[var(--app-border-strong)] xl:flex-col xl:gap-2 xl:px-2 xl:text-center ${isRtl ? 'text-right' : 'text-left'}`}
                            >
                                <Avatar className="h-11 w-11 shrink-0">
                                    <AvatarFallback>{user?.name?.slice(0, 1) ?? 'A'}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1 xl:w-full xl:flex-none">
                                    <div className="flex items-center gap-2 xl:justify-center">
                                        <p className="truncate text-sm font-semibold text-[var(--app-foreground)]">{user?.name ?? (ar ? 'مستخدم' : 'User')}</p>
                                        {user?.is_admin && (
                                            <Badge variant="warning" className="hidden h-7 w-7 justify-center overflow-hidden p-0 xl:flex">
                                                <Shield className="h-3.5 w-3.5" />
                                                {ar ? 'مشرف' : 'Admin'}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="truncate text-xs text-[var(--app-muted)] xl:hidden">{user?.email ?? 'assistant@algoag.test'}</p>
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64 border-white/12 bg-slate-950/95 p-2 text-slate-100 shadow-2xl shadow-cyan-950/35 backdrop-blur-xl">
                            <DropdownMenuLabel className="text-slate-300">{ar ? 'الحساب' : 'Account'}</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem asChild className="text-slate-100 focus:bg-cyan-400/12 focus:text-cyan-100">
                                <Link href="/assistant">{ar ? 'المساعد' : 'Assistant'}</Link>
                            </DropdownMenuItem>
                            {user?.is_admin && (
                                <DropdownMenuItem asChild className="text-slate-100 focus:bg-cyan-400/12 focus:text-cyan-100">
                                    <Link href="/admin">{ar ? 'الإدارة' : 'Admin'}</Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem disabled className="text-slate-500 opacity-100">
                                <CircleHelp className="h-4 w-4" />
                                {ar ? 'الإعدادات قريبا' : 'Settings soon'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem onClick={onLogout} className="text-slate-100 focus:bg-red-500/12 focus:text-red-100">
                                <LogOut className="h-4 w-4" />
                                {ar ? 'تسجيل الخروج' : 'Log out'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </TooltipProvider>
    );
}
