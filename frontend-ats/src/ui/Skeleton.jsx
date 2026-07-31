import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Vấn đề: Các trang đang hiện spinner giữa màn hình khi tải; lúc data về layout nhảy dựng lên, người dùng mất ngữ cảnh đang nhìn ở đâu.
// Giải pháp: Skeleton giữ đúng khung nội dung sắp xuất hiện, hiệu ứng shimmer đã định nghĩa trong index.css.
export function Skeleton({ className, ...props }) {
    return (
        <div
            className={twMerge(clsx('skeleton h-4 w-full', className))}
            aria-hidden="true"
            {...props}
        />
    );
}

// Vấn đề: Khối skeleton nhiều dòng bị copy đi copy lại; dòng cuối cần ngắn hơn mới giống đoạn văn thật.
// Giải pháp: SkeletonText nhận số dòng và tự thu ngắn dòng cuối.
export function SkeletonText({ lines = 3, className }) {
    return (
        <div className={twMerge(clsx('space-y-2', className))}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} className={i === lines - 1 ? 'w-2/3' : 'w-full'} />
            ))}
        </div>
    );
}

// Vấn đề: Trạng thái tải của danh sách (job, ứng viên) cần khung giống card thật mới tránh giật layout.
// Giải pháp: Dựng sẵn skeleton hình card để các trang danh sách dùng chung.
export function SkeletonCard({ className }) {
    return (
        <div className={twMerge(clsx('card p-5', className))}>
            <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
            </div>
            <SkeletonText lines={2} className="mt-4" />
        </div>
    );
}
