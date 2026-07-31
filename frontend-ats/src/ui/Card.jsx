import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Vấn đề: Chuỗi "bg-white border border-border rounded-lg" bị lặp ở hầu hết trang, mỗi nơi lệch một chút làm UI thiếu nhất quán.
// Giải pháp: Card + các slot con là nguồn duy nhất định nghĩa khung nội dung; đổi ngôn ngữ card toàn hệ thống chỉ sửa ở file này.
// Card phân vùng bằng viền 1px và KHÔNG đổ bóng — xem class .card trong index.css.

/**
 * @param {Object} props
 * @param {boolean} props.interactive - Thêm hiệu ứng nhấc nhẹ khi hover, dùng cho card có thể click
 * @param {React.ElementType} props.as - Đổi thẻ gốc (vd: 'section', 'li') để giữ HTML đúng ngữ nghĩa
 */
export function Card({ children, className, interactive, as: Tag = 'div', ...props }) {
    return (
        <Tag
            className={twMerge(clsx(interactive ? 'card-interactive' : 'card', className))}
            {...props}
        >
            {children}
        </Tag>
    );
}

// Vấn đề: Header của card cần đường kẻ phân cách nhưng nhiều card lại không có, dẫn tới padding chồng chéo khi ghép với CardBody.
// Giải pháp: Tách riêng header có border-b nhạt và padding thống nhất; bỏ divider bằng prop khi không cần.
export function CardHeader({ children, className, divided = true, ...props }) {
    return (
        <div
            className={twMerge(clsx(
                'flex items-start justify-between gap-4 px-5 py-4',
                divided && 'border-b border-border-subtle',
                className,
            ))}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardTitle({ children, className, subtitle, ...props }) {
    return (
        <div className="min-w-0">
            <h3 className={twMerge(clsx('text-base font-bold text-text-main truncate', className))} {...props}>
                {children}
            </h3>
            {subtitle && <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>}
        </div>
    );
}

export function CardBody({ children, className, ...props }) {
    return (
        <div className={twMerge(clsx('p-5', className))} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className, ...props }) {
    return (
        <div
            className={twMerge(clsx(
                'flex items-center justify-end gap-3 px-5 py-4 border-t border-border-subtle bg-surface rounded-b-lg',
                className,
            ))}
            {...props}
        >
            {children}
        </div>
    );
}
