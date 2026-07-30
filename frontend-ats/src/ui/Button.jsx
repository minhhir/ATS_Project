import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

// Vấn đề: Button submit form khi đang loading có thể bị user click double, gửi 2 request trùng; clsx + twMerge để class custom của caller override Tailwind default đúng cách.
// Giải pháp: Khi isLoading thì disable button và show spinner, twMerge gộp class với priority cuối cùng cho className caller truyền vào.
export function Button({ children, className, variant = 'primary', isLoading, disabled, ...props }) {
    const baseStyle = "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-primary text-white hover:bg-primary-hover shadow-sm",
        outline: "border border-border text-text-main hover:bg-surface",
    };

    return (
        <button className={twMerge(clsx(baseStyle, variants[variant], className))} disabled={isLoading || disabled} {...props}>
            {isLoading ? (
                <><Loader2 size={18} className="animate-spin" /><span>Đang xử lý...</span></>
            ) : children}
        </button>
    );
}