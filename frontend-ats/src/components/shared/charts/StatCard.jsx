import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass}`}>
                        <Icon size={24} />
                    </div>
                )}
                {hasGrowth && (
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${trendBg} ${trendColor}`}>
                        <TrendIcon size={14} />
                        {isUp ? '+' : ''}{growthPct}%
                    </div>
                )}
            </div>
            <p className="text-sm font-bold text-text-muted uppercase tracking-wider">{label}</p>
            <h3 className="text-3xl font-black text-text-main mt-1">{value}</h3>
            {hint && <p className="text-xs text-text-muted mt-2 font-medium">{hint}</p>}
        </div>
    );
}
