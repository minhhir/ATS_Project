import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Button({ children, isLoading, className, variant = 'primary', ...props }) {
    // Cấu hình các style cơ bản
    const baseStyle = "h-12 px-6 rounded-md font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed";

    // Cấu hình màu sắc theo từng loại nút (primary, outline, ghost)
    const variants = {
        primary: "bg-primary hover:bg-primary-dark text-white shadow-sm",
        outline: "border border-border-light dark:border-border-dark text-text-main dark:text-white hover:bg-slate-50 dark:hover:bg-surface-dark",
        ghost: "bg-transparent text-text-muted hover:text-text-main dark:hover:text-white hover:bg-slate-50 dark:hover:bg-surface-dark"
    };

    return (
        <button
            className={twMerge(clsx(baseStyle, variants[variant], className))}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <svg className="animate-spin w-5 h-5 text-current" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
            ) : children}
        </button>
    );
}