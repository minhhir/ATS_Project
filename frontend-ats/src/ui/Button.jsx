import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

// Vấn đề: Button submit form khi đang loading có thể bị user click double, gửi 2 request trùng; clsx + twMerge để class custom của caller override Tailwind default đúng cách.
// Giải pháp: Khi isLoading thì disable button và show spinner, twMerge gộp class với priority cuối cùng cho className caller truyền vào.

// Vấn đề: Khi mọi nút đều tô màu thì không nút nào nổi, người dùng phải đọc hết mới biết
// đâu là hành động chính; và màu ngữ nghĩa (xanh lá/vàng) dùng làm nút là dùng màu trạng
// thái để trang trí — về sau không phân biệt được "nút xanh" với "trạng thái đạt".
// Giải pháp: Chỉ `primary` được dùng màu accent, đó là hành động chính duy nhất trên màn hình.
// Mọi nút còn lại là trung tính. `danger` là ngoại lệ có lý do: hành động phá hủy cần cảnh báo
// trước khi click, không phải sau. KHÔNG có variant `success` — không có "hành động thành công".
const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-900",
    outline: "border border-border bg-white text-text-main hover:bg-surface hover:border-border-strong active:bg-surface-sunken",
    ghost: "text-text-muted hover:bg-surface hover:text-text-main active:bg-surface-sunken",
    danger: "bg-danger text-white hover:bg-danger-800 active:bg-danger-900",
    'danger-ghost': "text-danger hover:bg-danger-50 active:bg-danger-100",
};

// Vấn đề: Mỗi trang tự chỉnh px/py/text-size nên cùng một hàng nút lại cao thấp khác nhau.
// Giải pháp: Cố định 4 kích thước; `icon` là ô vuông để nút chỉ-icon không bị méo.
// Chiều cao tối thiểu 36px, riêng md/lg đạt 44px theo ngưỡng vùng chạm trên mobile.
const sizes = {
    sm: "h-9 px-3 text-sm gap-1.5",
    md: "h-11 px-4 text-sm gap-2",
    lg: "h-12 px-5 text-base gap-2",
    icon: "h-10 w-10 p-0",
};

/**
 * @param {Object} props
 * @param {'primary'|'outline'|'ghost'|'danger'|'danger-ghost'} props.variant
 * @param {'sm'|'md'|'lg'|'icon'} props.size
 * @param {boolean} props.isLoading
 * @param {string} props.loadingText - Text thay children khi loading; bỏ trống thì giữ nguyên children.
 * @param {boolean} props.fullWidth
 */
export function Button({
    children,
    className,
    variant = 'primary',
    size = 'md',
    isLoading,
    loadingText,
    fullWidth,
    disabled,
    type = 'button',
    ...props
}) {
    // Vấn đề: `disabled:pointer-events-none` chặn luôn cả con trỏ, nên khi nút bị vô hiệu hóa
    // người dùng không thấy dấu hiệu gì — chỉ thấy nút mờ và click không ăn, không biết tại sao.
    // Thuộc tính `disabled` của <button> đã tự chặn click nên pointer-events-none là dư.
    // Giải pháp: Bỏ pointer-events-none, dùng cursor-not-allowed để con trỏ nói rõ "không bấm được".
    const baseStyle = "inline-flex items-center justify-center rounded-lg font-semibold whitespace-nowrap transition-colors duration-200 ease-smooth select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

    const isDisabled = isLoading || disabled;

    return (
        <button
            type={type}
            className={twMerge(clsx(
                baseStyle,
                variants[variant] ?? variants.primary,
                sizes[size] ?? sizes.md,
                fullWidth && "w-full",
                className,
            ))}
            disabled={isDisabled}
            // `disabled` đã đủ cho trình duyệt, nhưng aria-disabled nói rõ trạng thái cho
            // screen reader ở cả trường hợp đang loading — lúc đó nút "tắt tạm", không phải hỏng.
            aria-disabled={isDisabled || undefined}
            aria-busy={isLoading || undefined}
            {...props}
        >
            {isLoading && <Loader2 size={16} className="animate-spin shrink-0" aria-hidden="true" />}
            {isLoading ? (loadingText ?? children) : children}
        </button>
    );
}
