import { useState, useId, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Eye, EyeOff } from 'lucide-react';

/**
 * @param {Object} props
 * @param {string} props.label
 * @param {React.ReactNode} props.labelRight
 * @param {React.ReactNode} props.leftIcon - Icon trang trí bên trái (search, mail...)
 * @param {React.ReactNode} props.rightIcon
 * @param {string} props.hint - Mô tả phụ dưới ô input, tự ẩn khi có error
 * @param {string} props.error
 */
// Vấn đề: Mỗi form đều phải tự xử lý label/error/show password riêng, rất lặp; React Hook Form cần forwardRef để register hoạt động.
// Giải pháp: Component bọc input có sẵn label/error/eye-toggle, dùng forwardRef để hook form gắn ref vào input gốc.
export const Input = forwardRef(({ label, labelRight, leftIcon, rightIcon, hint, error, className, type = 'text', id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    // Vấn đề: Không có id thì <label> không gắn được với input, click label không focus và screen reader đọc sai trường.
    // Giải pháp: useId sinh id ổn định qua các lần render, ưu tiên id caller truyền vào nếu có.
    const autoId = useId();
    const inputId = id || autoId;
    const describedById = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    const isPasswordType = type === 'password';

    // Vấn đề: Khi user toggle "hiện mật khẩu", phải đổi type input giữa text↔password mà không reset value.
    // Giải pháp: Tính inputType theo state showPassword, browser tự giữ value vì cùng 1 element.
    const inputType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

    const hasRightSlot = rightIcon || isPasswordType;

    return (
        <div className="flex flex-col gap-1.5 w-full">
            {(label || labelRight) && (
                <div className="flex justify-between items-center gap-2">
                    {label && <label htmlFor={inputId} className="text-sm font-semibold text-text-main">{label}</label>}
                    {labelRight && labelRight}
                </div>
            )}

            {/* Khối chứa ô Input chính */}
            <div className="relative w-full">
                {leftIcon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none" aria-hidden="true">
                        {leftIcon}
                    </div>
                )}

                <input
                    ref={ref}
                    id={inputId}
                    type={inputType}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedById}
                    className={twMerge(
                        clsx(
                            // Bo 4px (rounded-sm) — bậc dành cho input/badge trong thang 3 mức.
                            "w-full h-11 px-3 rounded-sm border bg-white text-sm text-text-main transition-colors duration-200 ease-smooth",
                            "placeholder:text-text-subtle hover:border-border-strong",
                            "focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary",
                            "disabled:bg-surface disabled:text-text-muted disabled:cursor-not-allowed disabled:hover:border-border",
                            error
                                ? "border-danger hover:border-danger focus:border-danger focus:ring-danger/10"
                                : "border-border",
                            leftIcon && "pl-10",
                            hasRightSlot && "pr-10",
                            className
                        )
                    )}
                    {...props}
                />

                {isPasswordType ? (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-sm text-text-subtle hover:text-text-main hover:bg-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        // Vấn đề: tabIndex={-1} loại nút này khỏi thứ tự Tab, nên người dùng bàn phím
                        // không bao giờ tới được — và cũng không bao giờ thấy được focus state.
                        // Người dùng bàn phím là nhóm cần xem lại mật khẩu vừa gõ nhất.
                        // Giải pháp: Cho nút vào thứ tự Tab bình thường kèm focus ring rõ ràng.
                        aria-pressed={showPassword}
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                ) : rightIcon ? (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none">
                        {rightIcon}
                    </div>
                ) : null}
            </div>

            {error ? (
                <span id={`${inputId}-error`} className="text-xs text-danger font-medium">{error}</span>
            ) : hint ? (
                <span id={`${inputId}-hint`} className="text-xs text-text-muted">{hint}</span>
            ) : null}
        </div>
    );
});

Input.displayName = 'Input';
