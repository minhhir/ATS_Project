import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Vấn đề: KPI card cần hiển thị cả số liệu và mức tăng/giảm so với kỳ trước; trend 0% và undefined có ý nghĩa khác (không đổi vs không có dữ liệu).
// Giải pháp: hasGrowth check theo typeof number để phân biệt undefined; chọn icon/màu trend theo sign số để user nhìn 1 phát hiểu xu hướng.
export function StatCard({ icon: Icon, label, value, growthPct, bgClass = 'bg-primary/10', colorClass = 'text-primary', hint }) {
    const hasGrowth = typeof growthPct === 'number';
    const isUp = hasGrowth && growthPct > 0;
    const isDown = hasGrowth && growthPct < 0;
    const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
    const trendColor = isUp ? 'text-success' : isDown ? 'text-danger' : 'text-text-muted';
    const trendBg = isUp ? 'bg-success/10' : isDown ? 'bg-danger/10' : 'bg-surface';

    return (
        <div className="bg-white p-6 rounded-3xl border border-border shadow-sm">
            <div className="flex items-start justify-between mb-4">
                {Icon && (
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass}`}>
                        <Icon size={28} />
                    </div>
                )}
                {hasGrowth && (
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-black ${trendBg} ${trendColor}`}>
                        <TrendIcon size={16} />
                        {isUp ? '+' : ''}{growthPct}%
                    </div>
                )}
            </div>
            <p className="text-sm font-bold text-text-muted uppercase tracking-wider">{label}</p>
            <h3 className="text-4xl font-black text-text-main mt-1.5 leading-tight">{value}</h3>
            {hint && <p className="text-sm text-text-muted mt-2.5 font-medium">{hint}</p>}
        </div>
    );
}
