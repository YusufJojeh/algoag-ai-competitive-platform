import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(({ className, type, ...props }, ref) => {
    return (
        <input
            ref={ref}
            type={type}
            className={cn(
                'flex h-11 w-full rounded-2xl border border-[var(--app-border)] bg-slate-950/55 px-4 py-2 text-sm text-[var(--app-foreground)] shadow-sm outline-none transition placeholder:text-[var(--app-muted)] focus-visible:border-[var(--app-border-strong)] focus-visible:ring-4 focus-visible:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            {...props}
        />
    );
});
Input.displayName = 'Input';

export { Input };
