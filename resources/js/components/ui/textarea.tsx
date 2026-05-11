import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(({ className, ...props }, ref) => {
    return (
        <textarea
            ref={ref}
            className={cn(
                'flex min-h-[128px] w-full rounded-[24px] border border-[var(--app-border)] bg-white/90 px-4 py-3 text-sm text-[var(--app-foreground)] shadow-sm outline-none transition placeholder:text-[var(--app-muted)] focus-visible:border-[var(--app-border-strong)] focus-visible:ring-4 focus-visible:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            {...props}
        />
    );
});
Textarea.displayName = 'Textarea';

export { Textarea };
