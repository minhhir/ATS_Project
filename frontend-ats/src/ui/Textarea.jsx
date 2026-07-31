import { forwardRef, useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * @param {Object} props
 * @param {string} props.label
 * @param {string} props.hint - Mô tả phụ dưới ô nhập, tự ẩn khi có error
 * @param {string} props.error
 */
// Vấn đề: Textarea cần style đồng bộ với Input và hiển thị error giống nhau; React Hook Form yêu cầu forwardRef.
// Giải pháp: Component có sẵn label/error/min-height, twMerge cho phép caller override class an toàn.
export const Textarea = forwardRef(({ label, hint, error, className, id, ...props }, ref) => {
    // Giống Input: cần id để label và thông báo lỗi gắn đúng vào ô nhập cho screen reader.
    const autoId = useId();
    const textareaId = id || autoId;
    const describedById = error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined;

    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && <label htmlFor={textareaId} className="text-sm font-semibold text-text-main">{label}</label>}
            <textarea
                ref={ref}
                id={textareaId}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedById}
                className={twMerge(
                    clsx(
                        // Bo 4px đồng bộ với Input — cùng bậc "ô nhập" trong thang bo góc.
                        "w-full px-3 py-2.5 rounded-sm border bg-white text-sm text-text-main transition-colors duration-200 ease-smooth min-h-[120px] resize-y",
                        "placeholder:text-text-subtle hover:border-border-strong",
                        "focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary",
                        "disabled:bg-surface disabled:text-text-muted disabled:cursor-not-allowed disabled:hover:border-border",
                        error
                            ? "border-danger hover:border-danger focus:border-danger focus:ring-danger/10"
                            : "border-border",
                        className
                    )
                )}
                {...props}
            />
            {error ? (
                <span id={`${textareaId}-error`} className="text-xs text-danger font-medium">{error}</span>
            ) : hint ? (
                <span id={`${textareaId}-hint`} className="text-xs text-text-muted">{hint}</span>
            ) : null}
        </div>
    );
});

Textarea.displayName = 'Textarea';
