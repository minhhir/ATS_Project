import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Textarea = forwardRef(({ label, error, className, ...props }, ref) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && <label className="text-sm font-semibold text-text-main">{label}</label>}
            <textarea
                ref={ref}
                className={twMerge(
                    clsx(
                        "w-full px-4 py-3 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm placeholder:text-text-muted min-h-[120px] resize-y",
                        error ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border",
                        className
                    )
                )}
                {...props}
            />
            {error && <span className="text-xs text-danger font-medium mt-0.5">{error}</span>}
        </div>
    );
});

Textarea.displayName = 'Textarea';