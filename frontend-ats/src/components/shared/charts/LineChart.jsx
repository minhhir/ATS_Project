import { useMemo, useState, useId } from 'react';
import { useChartWidth } from '@/hooks/useChartWidth';
import { CHART_CATEGORICAL, CHART_AXIS } from '@/utils/chartColors';

// Vấn đề: Bảng màu mặc định cũ là xanh dương / xanh lá / vàng / đỏ — bốn hue rời rạc, và ba trong
// số đó là màu ngữ nghĩa nên người đọc tưởng đường vàng nghĩa là "cảnh báo".
// Giải pháp: Thang xanh-dương đậm dần cộng một mức xám; đã có chú giải nên không cần tách bằng hue.
// Bảng màu giờ nằm ở @/utils/chartColors để không trôi khỏi tailwind.config.js.

// Vấn đề: Cần biểu đồ trend đa series (vd users/jobs/applications theo ngày) nhưng không muốn import lib lớn; nhiều label X sẽ chen chúc đè nhau.
// Giải pháp: SVG thuần với area + line, hover state để show tooltip, số mốc trục X tính theo bề rộng thật.
//
// Vấn đề: viewBox cố định 760 rồi co bằng `w-full` — ở 375px tỉ lệ còn 0.399, fontSize 12 ra 4.8px.
// Giải pháp: đo bề rộng thật rồi đặt viewBox bằng đúng số đó, 1 đơn vị SVG = 1 pixel CSS.
export function LineChart({ series = [], height = 300, formatX = (s) => s, yLabel, title, desc }) {
    const [hover, setHover] = useState(null);
    const titleId = useId();
    const descId = useId();
    const [containerRef, width] = useChartWidth();

    const { lines, maxY, xLabels, n, padding, innerW, innerH, labelStride } = useMemo(() => {
        const padding = { top: 20, right: 16, bottom: 36, left: width < 420 ? 34 : 48 };
        const innerW = Math.max(0, width - padding.left - padding.right);
        const innerH = height - padding.top - padding.bottom;
        const n = series[0]?.points?.length || 0;
        const maxVal = Math.max(1, ...series.flatMap(s => s.points.map(p => p.y)));
        const niceMax = Math.ceil(maxVal * 1.15);
        const xLabels = series[0]?.points?.map(p => p.x) || [];

        // Số mốc trục X tính từ chỗ thật sự có: một nhãn kiểu "30/7" chiếm ~56px kể cả khoảng thở.
        // Bản cũ luôn hiện ~6 mốc bất kể bề rộng, nên ở mobile sáu nhãn chen nhau trong 249px.
        const maxLabels = Math.max(2, Math.min(6, Math.floor(innerW / 56)));
        const labelStride = Math.max(1, Math.ceil(n / maxLabels));

        const lines = series.map((s, idx) => {
            const color = s.color || CHART_CATEGORICAL[idx % CHART_CATEGORICAL.length];
            const pts = s.points.map((p, i) => {
                const x = padding.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
                const y = padding.top + innerH - (p.y / niceMax) * innerH;
                return { x, y, raw: p };
            });
            const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            const area = `${path} L ${pts[pts.length - 1].x} ${padding.top + innerH} L ${pts[0].x} ${padding.top + innerH} Z`;
            return { ...s, color, pts, path, area };
        });

        return { lines, maxY: niceMax, xLabels, n, padding, innerW, innerH, labelStride };
    }, [series, height, width]);

    if (!series.length || !n) {
        return <div className="h-64 flex items-center justify-center text-sm text-text-muted">Chưa có dữ liệu</div>;
    }

    const yTicks = 4;

    // Mô tả text cho screen reader: nêu từng chuỗi kèm mốc đầu/cuối và giá trị lớn nhất —
    // đủ để nắm xu hướng mà không cần nhìn được đường vẽ.
    const chartTitle = title || 'Biểu đồ xu hướng theo thời gian';
    const chartDesc = desc || lines.map(s => {
        const ys = s.pts.map(p => p.raw.y);
        const first = s.pts[0]?.raw;
        const last = s.pts[s.pts.length - 1]?.raw;
        return `${s.name}: từ ${formatX(first?.x)} (${first?.y}) đến ${formatX(last?.x)} (${last?.y}), cao nhất ${Math.max(...ys)}`;
    }).join('. ') + '.';

    // Hộp tooltip phải nằm gọn trong khung kể cả khi rê vào điểm sát mép phải.
    const tipW = 120;

    return (
        <div ref={containerRef} className="w-full overflow-hidden">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                width={width}
                height={height}
                role="img"
                aria-labelledby={`${titleId} ${descId}`}
            >
                <title id={titleId}>{chartTitle}</title>
                <desc id={descId}>{chartDesc}</desc>

                {/* Grid + Y axis ticks */}
                {[...Array(yTicks + 1)].map((_, i) => {
                    const y = padding.top + (i / yTicks) * innerH;
                    const val = Math.round(maxY * (1 - i / yTicks));
                    return (
                        <g key={i}>
                            <line x1={padding.left} x2={padding.left + innerW} y1={y} y2={y} stroke={CHART_AXIS.grid} strokeDasharray="3 3" />
                            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="12" fill={CHART_AXIS.label}>{val}</text>
                        </g>
                    );
                })}

                {/* Area + Line */}
                {lines.map((s, idx) => (
                    <g key={idx}>
                        <path d={s.area} fill={s.color} opacity="0.08" />
                        <path d={s.path} stroke={s.color} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                        {s.pts.map((p, i) => (
                            <circle
                                key={i}
                                cx={p.x}
                                cy={p.y}
                                r={hover && hover.seriesIdx === idx && hover.i === i ? 6 : 3.5}
                                fill={s.color}
                                onMouseEnter={() => setHover({ seriesIdx: idx, i, x: p.x, y: p.y, value: p.raw.y, label: p.raw.x })}
                                onMouseLeave={() => setHover(null)}
                                style={{ cursor: 'pointer' }}
                            />
                        ))}
                    </g>
                ))}

                {/* X axis labels — mật độ theo bề rộng thật, luôn giữ mốc cuối */}
                {xLabels.map((lbl, i) => {
                    if (i % labelStride !== 0 && i !== n - 1) return null;
                    const x = padding.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
                    return (
                        <text key={i} x={x} y={height - 10} textAnchor="middle" fontSize="12" fill={CHART_AXIS.label}>
                            {formatX(lbl)}
                        </text>
                    );
                })}

                {/* Tooltip */}
                {hover && (
                    <g pointerEvents="none">
                        <line x1={hover.x} x2={hover.x} y1={padding.top} y2={padding.top + innerH} stroke={CHART_AXIS.crosshair} strokeDasharray="3 3" />
                        <rect x={Math.max(0, Math.min(hover.x + 10, width - tipW - 4))} y={hover.y - 38} width={tipW} height="42" rx="4" fill={CHART_AXIS.tooltipBg} />
                        <text x={Math.max(0, Math.min(hover.x + 10, width - tipW - 4)) + 10} y={hover.y - 22} fontSize="11" fill={CHART_AXIS.tooltipLabel}>{formatX(hover.label)}</text>
                        <text x={Math.max(0, Math.min(hover.x + 10, width - tipW - 4)) + 10} y={hover.y - 7} fontSize="14" fill={CHART_AXIS.tooltipValue} fontWeight="600">{hover.value}{yLabel ? ` ${yLabel}` : ''}</text>
                    </g>
                )}
            </svg>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-3">
                {lines.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                        <span className="text-sm text-text-muted">{s.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
