import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Input({ label, icon, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Label của Input */}
      {label && <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</label>}

      <div className="relative">
        <input
          className={twMerge(
            clsx(
              "w-full h-12 px-4 rounded-md bg-white dark:bg-surface-dark border text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary transition-all",
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-border-light dark:border-border-dark focus:border-primary",
              icon && "pr-10", // Chừa khoảng trống nếu có icon bên phải
              className
            )
          )}
          {...props}
        />
        {/* Icon bên phải (ví dụ: hình con mắt, hình lá thư) */}
        {icon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </div>
        )}
      </div>

      {/* Hiển thị lỗi (Validation Error) */}
      {error && <span className="text-xs text-red-500 font-medium mt-0.5">{error}</span>}
    </div>
  );
}