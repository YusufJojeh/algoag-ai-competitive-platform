import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0',
    {
        variants: {
            variant: {
                default:
                    'bg-gradient-to-r from-violet-500 via-violet-400 to-cyan-400 text-slate-950 shadow-[0_0_30px_rgba(56,189,248,0.18)] hover:scale-[1.02]',
                secondary:
                    'border border-white/12 bg-white/6 text-slate-100 hover:border-cyan-300/40 hover:bg-white/10',
                ghost:
                    'text-slate-200 hover:bg-white/8',
                outline:
                    'border border-white/14 bg-slate-950/40 text-slate-100 hover:border-violet-300/40 hover:bg-slate-900/70',
                lavender:
                    'border border-cyan-300/20 bg-gradient-to-r from-violet-500 via-violet-400 to-cyan-400 text-slate-950 shadow-[0_0_30px_rgba(56,189,248,0.18)] hover:scale-[1.02] focus-visible:ring-cyan-400/70',
                soft:
                    'border border-white/12 bg-white/6 text-slate-100 hover:border-cyan-300/40 hover:bg-white/10 focus-visible:ring-cyan-400/40',
                surface:
                    'border border-white/10 bg-slate-950/40 text-[var(--app-foreground)] shadow-sm hover:border-cyan-300/30 hover:bg-slate-900/80',
                danger:
                    'bg-[var(--app-danger)] text-slate-950 shadow-[0_0_24px_rgba(251,113,133,0.18)] hover:bg-rose-400 focus-visible:ring-rose-300/50',
                sidebar:
                    'justify-start rounded-2xl border border-transparent bg-transparent text-[var(--app-muted-strong)] hover:bg-white/6 hover:text-[var(--app-foreground)]',
            },
            size: {
                default: 'h-11 px-5',
                sm: 'h-9 px-4 text-xs',
                lg: 'h-12 px-6 text-base',
                icon: 'size-10 rounded-full',
                sidebar: 'h-11 w-full justify-start rounded-2xl px-3 text-sm',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';

        return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
    }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
