import { useMemo } from 'react';

export function BarChart({ data = [], color = '#0284c7', height = 240, valueSuffix = '' }) {
    const { bars, maxY, padding, width, innerW, innerH } = useMemo(() => {
        const padding = { top: 16, right: 16, bottom: 50, left: 36 };
        const width = 720;
        const innerW = width - padding.left - padding.right;
        const innerH = height - padding.top - padding.bottom;
        const maxVal = Math.max(1, ...data.map(d => d.value));
        const niceMax = Math.ceil(maxVal * 1.15);
        const slot = data.length ? innerW / data.length : 0;
        const barW = Math.min(40, slot * 0.6);

        const bars = data.map((d, i) => {
            const cx = padding.left + slot * (i + 0.5);
            const h = (d.value / niceMax) * innerH;
            return {
                ...d,
                x: cx - barW / 2,
                y: padding.top + innerH - h,
                w: barW,
                h
            };
        });

        return { bars, maxY: niceMax, padding, width, innerW, innerH };
    }, [data, height]);

    if (!data.length) {
        return <div className="h-60 flex items-center justify-center text-text-muted text-sm font-medium">Chưa có dữ liệu</div>;
    }

    const yTicks = 4;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            {[...Array(yTicks + 1)].map((_, i) => {
                const y = padding.top + (i / yTicks) * innerH;
                const val = Math.round(maxY * (1 - i / yTicks));
                return (
                    <g key={i}>
                        <line x1={padding.left} x2={padding.left + innerW} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                        <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b" fontWeight="700">{val}</text>
                    </g>
                );
            })}

            {bars.map((b, i) => (
                <g key={i}>
                    <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={b.color || color} rx="6">
                        <title>{b.label}: {b.value}{valueSuffix}</title>
                    </rect>
                    <text x={b.x + b.w / 2} y={b.y - 6} textAnchor="middle" fontSize="11" fill="#0f172a" fontWeight="900">
                        {b.value}{valueSuffix}
                    </text>
                    <text x={b.x + b.w / 2} y={height - 30} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="700">
                        <tspan>{b.label.length > 14 ? b.label.slice(0, 14) + '…' : b.label}</tspan>
                    </text>
                </g>
            ))}
        </svg>
    );
}
