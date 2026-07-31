import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Vấn đề: Trạng thái đơn ứng tuyển / tin tuyển dụng được tô màu thủ công ở từng trang, nên cùng một
// trạng thái lại ra hai màu khác nhau giữa trang HR và trang ứng viên.
// Giải pháp: Badge với bộ variant cố định; trang chỉ việc map trạng thái → variant.
//
// LƯU Ý VỀ MÀU: màu ngữ nghĩa ở đây chỉ dùng cho TRẠNG THÁI THẬT của hồ sơ, không dùng để
// trang trí hay phân loại chung chung. Nhãn không mang nghĩa tốt/xấu (loại hình công việc,
// cấp bậc, phòng ban) phải dùng `neutral` — nếu tô màu bừa thì màu mất hết ý nghĩa và HR
// không còn quét nhanh được cột trạng thái.
//   neutral → nháp, đã đóng, thông tin phân loại
//   primary → đang xử lý, đang phỏng vấn
//   success → đã tuyển, đạt vòng
//   warning → chờ duyệt, sắp hết hạn
//   danger  → từ chối, quá hạn
const variants = {
    neutral: 'bg-surface-sunken text-text-muted border-border',
    primary: 'bg-primary-light text-primary-800 border-primary-200',
    success: 'bg-success-50 text-success-700 border-success-100',
    warning: 'bg-warning-50 text-warning-700 border-warning-100',
    danger: 'bg-danger-50 text-danger-700 border-danger-100',
};

/**
 * @param {Object} props
 * @param {'neutral'|'primary'|'success'|'warning'|'danger'} props.variant
 * @param {boolean} props.dot - Chấm tròn cùng màu; giữ phân biệt được trạng thái cả khi in
 *   đen trắng hoặc với người mù màu, vì không được truyền tin chỉ bằng màu.
 */
export function Badge({ children, className, variant = 'neutral', dot, ...props }) {
    return (
        <span
            className={twMerge(clsx(
                // Bo 4px + viền 1px, không bo tròn viên thuốc: badge cùng bậc với input
                // trong thang bo góc, và phân vùng bằng viền chứ không bằng nền đặc.
                'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                variants[variant] ?? variants.neutral,
                className,
            ))}
            {...props}
        >
            {dot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" aria-hidden="true" />}
            {children}
        </span>
    );
}
