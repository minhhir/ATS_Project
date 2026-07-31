import { useMemo, useId } from 'react';
import { CHART_AXIS } from '@/utils/chartColors';

// Vấn đề: SVG arc với góc đúng 360 độ sẽ collapse về 1 điểm (path lệnh A không vẽ đủ vòng); tính phần trăm/tổng mỗi render dù data không đổi sẽ gây giật.
// Giải pháp: Trừ 0.0001 rad khi end-start === 1 để arc gần kín nhưng không bị degenerate, dùng useMemo cache arcs theo data/size.
export function DonutChart({ data = [], size = 200, thickness = 28, centerLabel, centerValue, title, desc }) {
    const titleId = useId();
    const descId = useId();

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
        return <div className="h-52 flex items-center justify-center text-sm text-text-muted">Chưa có dữ liệu</div>;
    }

    // Vấn đề: SVG không có nội dung thay thế thì screen reader đọc ra một phần tử graphics rỗng —
    // toàn bộ số liệu trong biểu đồ trở nên vô hình với người không nhìn được.
    // Giải pháp: <title> làm tên biểu đồ, <desc> đọc ra đầy đủ từng phần và tỉ lệ, kèm role="img"
    // + aria-labelledby để trình đọc màn hình coi cả khối là một hình có mô tả.
    const chartTitle = title || centerLabel || 'Biểu đồ tròn';
    const chartDesc = desc || `Tổng ${total}. ${arcs.map(a => `${a.label}: ${a.value} (${a.pct}%)`).join('. ')}.`;

    return (
        <div className="flex items-center gap-5 flex-wrap">
            <div className="relative shrink-0" style={{ width: size, height: size }}>
                <svg
                    viewBox={`0 0 ${size} ${size}`}
                    width={size}
                    height={size}
                    role="img"
                    aria-labelledby={`${titleId} ${descId}`}
                >
                    <title id={titleId}>{chartTitle}</title>
                    <desc id={descId}>{chartDesc}</desc>
                    <circle cx={size / 2} cy={size / 2} r={(size - thickness) / 2} fill="none" stroke={CHART_AXIS.track} strokeWidth={thickness} />
                    {arcs.map((a, i) => (
                        <path key={i} d={a.path} stroke={a.color} strokeWidth={thickness} fill="none" strokeLinecap="butt">
                            <title>{a.label}: {a.value} ({a.pct}%)</title>
                        </path>
                    ))}
                </svg>
                {/* Số ở tâm là thứ đọc trước tiên → 28px/600, nhãn bên dưới nhỏ và nhạt hơn */}
                <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
                    <div className="text-2xl font-semibold text-text-main tabular-nums">{centerValue ?? total}</div>
                    {centerLabel && <div className="text-xs text-text-muted mt-0.5">{centerLabel}</div>}
                </div>
            </div>

            {/* Chú giải: chấm màu + nhãn, nhưng số liệu vẫn đọc được cả khi không phân biệt được màu */}
            <ul className="flex-1 min-w-[160px] space-y-1.5">
                {arcs.map((a, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: a.color }} aria-hidden="true" />
                            <span className="text-text-muted truncate">{a.label}</span>
                        </span>
                        <span className="flex items-center gap-2 shrink-0 tabular-nums">
                            <span className="font-semibold text-text-main">{a.value}</span>
                            <span className="text-xs text-text-subtle">{a.pct}%</span>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
