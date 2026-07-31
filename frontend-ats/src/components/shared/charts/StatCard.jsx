import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from '@/ui/Skeleton';

// Vấn đề: KPI card cần hiển thị cả số liệu và mức tăng/giảm so với kỳ trước; trend 0% và undefined có ý nghĩa khác (không đổi vs không có dữ liệu).
// Giải pháp: hasGrowth check theo typeof number để phân biệt undefined; chọn icon/màu trend theo sign số để user nhìn 1 phát hiểu xu hướng.
//
// Vấn đề: Bản cũ đặt một khối icon 56px nền tint ở góc trên, to gần gấp đôi con số bên dưới —
// thứ đập vào mắt trước lại là hình trang trí, không phải số liệu HR cần đọc.
// Giải pháp: Bỏ khối icon, icon thu về 14px màu trung tính đứng cạnh nhãn. Con số là phần tử
// lớn nhất và đậm nhất trong card. Phân vùng bằng viền 1px, không shadow.
export function StatCard({ icon: Icon, label, value, growthPct, hint, loading }) {
    const hasGrowth = typeof growthPct === 'number';
    const isUp = hasGrowth && growthPct > 0;
    const isDown = hasGrowth && growthPct < 0;
    const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
    // Màu chỉ dùng cho xu hướng thật (tăng/giảm), không dùng để tô cho đẹp.
    const trendColor = isUp ? 'text-success' : isDown ? 'text-danger' : 'text-text-subtle';

    if (loading) {
        return (
            <div className="border border-border rounded-lg bg-surface-raised p-4" aria-busy="true">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-16 mt-2.5" />
                <Skeleton className="h-3 w-32 mt-2.5" />
            </div>
        );
    }

    return (
        <div className="border border-border rounded-lg bg-surface-raised p-4">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    {Icon && <Icon size={14} className="text-text-subtle shrink-0" aria-hidden="true" />}
                    <p className="text-xs text-text-muted truncate">{label}</p>
                </div>
                {hasGrowth && (
                    <span className={`inline-flex items-center gap-0.5 text-xs font-medium shrink-0 ${trendColor}`}>
                        <TrendIcon size={13} aria-hidden="true" />
                        {isUp ? '+' : ''}{growthPct}%
                    </span>
                )}
            </div>

            {/* Con số: 28px/600 — bậc cỡ chữ lớn nhất của hệ thống, dành riêng cho thứ này */}
            <p className="text-2xl font-semibold text-text-main mt-1.5 tabular-nums">{value}</p>

            {hint && <p className="text-xs text-text-subtle mt-1.5">{hint}</p>}
        </div>
    );
}
