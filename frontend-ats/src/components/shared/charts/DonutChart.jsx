import { useMemo } from 'react';

// Vấn đề: SVG arc với góc đúng 360 độ sẽ collapse về 1 điểm (path lệnh A không vẽ đủ vòng); tính phần trăm/tổng mỗi render dù data không đổi sẽ gây giật.
// Giải pháp: Trừ 0.0001 rad khi end-start === 1 để arc gần kín nhưng không bị degenerate, dùng useMemo cache arcs theo data/size.
export function DonutChart({ data = [], size = 240, thickness = 34, centerLabel, centerValue }) {
    const { arcs, total } = useMemo(() => {
        const total = data.reduce((s, d) => s + d.value, 0);
        if (!total) return { arcs: [], total: 0 };
        const r = (size - thickness) / 2;
        const cx = size / 2;
        const cy = size / 2;
        let acc = 0;
        const arcs = data.map((d) => {
            const start = acc / total;
            const end = (acc + d.value) / total;
            acc += d.value;
            const a0 = start * Math.PI * 2 - Math.PI / 2;
            const a1 = end * Math.PI * 2 - Math.PI / 2;
            const large = end - start > 0.5 ? 1 : 0;
            // Avoid degenerate full-circle path collapse
            const safeA1 = end - start === 1 ? a1 - 0.0001 : a1;
            const x0 = cx + r * Math.cos(a0);
            const y0 = cy + r * Math.sin(a0);
            const x1 = cx + r * Math.cos(safeA1);
            const y1 = cy + r * Math.sin(safeA1);
            const path = `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
            const pct = Math.round((d.value / total) * 1000) / 10;
            return { ...d, path, pct };
        });
        return { arcs, total };
    }, [data, size, thickness]);

    if (!data.length || !total) {
        return <div className="h-72 flex items-center justify-center text-text-muted text-base font-medium">Chưa có dữ liệu</div>;
    }

    return (
        <div className="flex items-center gap-6 flex-wrap">
            <div className="relative shrink-0" style={{ width: size, height: size }}>
                <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
                    <circle cx={size / 2} cy={size / 2} r={(size - thickness) / 2} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
                    {arcs.map((a, i) => (
                        <path key={i} d={a.path} stroke={a.color} strokeWidth={thickness} fill="none" strokeLinecap="butt">
                            <title>{a.label}: {a.value} ({a.pct}%)</title>
                        </path>
                    ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl font-black text-text-main">{centerValue ?? total}</div>
                    {centerLabel && <div className="text-sm font-bold text-text-muted uppercase tracking-wider mt-1">{centerLabel}</div>}
                </div>
            </div>
            <div className="flex-1 min-w-[160px] space-y-2.5">
                {arcs.map((a, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-base">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: a.color }} />
                            <span className="font-bold text-text-main truncate">{a.label}</span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                            <span className="font-black text-text-main">{a.value}</span>
                            <span className="text-sm font-bold text-text-muted">{a.pct}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
