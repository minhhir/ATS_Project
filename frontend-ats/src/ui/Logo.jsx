// src/ui/Logo.jsx
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Vấn đề: Logo xuất hiện ở header/auth/sidebar; nếu copy markup, đổi tên brand sẽ phải sửa nhiều chỗ và link về home dễ sai.
// Giải pháp: Component duy nhất nhận className tùy chỉnh, mặc định link về "/" để click logo bất kỳ chỗ nào đều quay về landing.

// Vấn đề: Logo cũ cố định h-14 (56px) nên trong header cao 64px gần như chạm mép trên dưới, nhìn chật.
// Giải pháp: 3 cỡ chuẩn — sm cho header/sidebar, md mặc định, lg cho trang auth và landing.
const sizes = {
    sm: { img: 'h-8', text: 'text-base' },
    md: { img: 'h-9', text: 'text-lg' },
    lg: { img: 'h-12', text: 'text-2xl' },
};

/**
 * @param {Object} props
 * @param {'sm'|'md'|'lg'} props.size
 * @param {boolean} props.showText - Ẩn chữ khi sidebar thu gọn, chỉ còn icon
 * @param {string|null} props.to - Truyền null khi logo đã nằm trong một link khác, tránh lồng thẻ <a>
 */
export function Logo({ className, size = 'md', showText = true, to = '/' }) {
    const s = sizes[size] ?? sizes.md;

    const content = (
        <>
            <img
                src="/Mini ATS.png"
                alt="Mini ATS"
                className={clsx(s.img, 'w-auto object-contain rounded-lg shrink-0')}
            />
            {showText && (
                <span className={clsx(s.text, 'font-bold text-text-main')}>Mini ATS</span>
            )}
        </>
    );

    const classes = twMerge(clsx('flex items-center gap-2.5 shrink-0', className));

    if (!to) {
        return <div className={classes}>{content}</div>;
    }

    return (
        <Link to={to} className={twMerge(classes, 'rounded-lg transition-opacity hover:opacity-80')}>
            {content}
        </Link>
    );
}
