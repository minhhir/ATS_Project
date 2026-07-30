import { useMemo } from 'react';

// Vấn đề: Chưa có thư viện chart nhưng vẫn cần biểu đồ cột nhẹ; tính toán bar width/height mỗi render sẽ tốn CPU khi data lớn.
// Giải pháp: SVG thuần hand-written, useMemo để chỉ recalculate bars khi data/height đổi, niceMax x1.15 để cột cao nhất không chạm trần.
export function BarChart({ data = [], color = '#0284c7', height = 320, valueSuffix = '' }) {
    const { bars, maxY, padding, width, innerW, innerH } = useMemo(() => {
        const padding = { top: 24, right: 20, bottom: 60, left: 48 };
        const width = 760;
        const innerW = width - padding.left - padding.right;
        const innerH = height - padding.top - padding.bottom;
        const maxVal = Math.max(1, ...data.map(d => d.value));
        const niceMax = Math.ceil(maxVal * 1.15);
        const slot = data.length ? innerW / data.length : 0;
        const barW = Math.min(56, slot * 0.65);

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
        return <div className="h-80 flex items-center justify-center text-text-muted text-base font-medium">Chưa có dữ liệu</div>;
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
                        <text x={padding.left - 10} y={y + 5} textAnchor="end" fontSize="13" fill="#475569" fontWeight="700">{val}</text>
                    </g>
                );
            })}

            {bars.map((b, i) => (
                <g key={i}>
                    <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={b.color || color} rx="8">
                        <title>{b.label}: {b.value}{valueSuffix}</title>
                    </rect>
                    <text x={b.x + b.w / 2} y={b.y - 8} textAnchor="middle" fontSize="14" fill="#0f172a" fontWeight="900">
                        {b.value}{valueSuffix}
                    </text>
                    <text x={b.x + b.w / 2} y={height - 32} textAnchor="middle" fontSize="13" fill="#475569" fontWeight="700">
                        <tspan>{b.label.length > 18 ? b.label.slice(0, 18) + '…' : b.label}</tspan>
                    </text>
                </g>
            ))}
        </svg>
    );
}
