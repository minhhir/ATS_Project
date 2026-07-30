import { useState, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Eye, EyeOff } from 'lucide-react';

/**
 * @param {Object} props
 * @param {string} props.label
 * @param {React.ReactNode} props.labelRight 
 * @param {React.ReactNode} props.rightIcon 
 * @param {string} props.error 
 */
// Vấn đề: Mỗi form đều phải tự xử lý label/error/show password riêng, rất lặp; React Hook Form cần forwardRef để register hoạt động.
// Giải pháp: Component bọc input có sẵn label/error/eye-toggle, dùng forwardRef để hook form gắn ref vào input gốc.
export const Input = forwardRef(({ label, labelRight, rightIcon, error, className, type = 'text', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordType = type === 'password';

    // Vấn đề: Khi user toggle "hiện mật khẩu", phải đổi type input giữa text↔password mà không reset value.
    // Giải pháp: Tính inputType theo state showPassword, browser tự giữ value vì cùng 1 element.
    const inputType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="flex flex-col gap-1.5 w-full">
            {(label || labelRight) && (
                <div className="flex justify-between items-center">
                    {label && <label className="text-sm font-semibold text-text-main">{label}</label>}
                    {labelRight && labelRight}
                </div>
            )}

            {/* Khối chứa ô Input chính */}
            <div className="relative w-full">
                <input
                    ref={ref}
                    type={inputType}
                    className={twMerge(
                        clsx(
                            "w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm placeholder:text-text-muted",
                            error ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border",
                            (rightIcon || isPasswordType) && "pr-10",
                            className
                        )
                    )}
                    {...props}
                />
                {isPasswordType ? (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors focus:outline-none"
                        tabIndex="-1"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                ) : rightIcon ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                        {rightIcon}
                    </div>
                ) : null}

            </div>
            {error && <span className="text-xs text-danger font-medium mt-0.5">{error}</span>}
        </div>
    );
});

Input.displayName = 'Input';