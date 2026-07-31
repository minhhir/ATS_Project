import { useMemo, useId } from 'react';
import { useChartWidth } from '@/hooks/useChartWidth';
import { CHART_RAMP, CHART_AXIS } from '@/utils/chartColors';

// Vấn đề: Chưa có thư viện chart nhưng vẫn cần biểu đồ cột nhẹ; tính toán bar width/height mỗi render sẽ tốn CPU khi data lớn.
// Giải pháp: SVG thuần hand-written, useMemo để chỉ recalculate bars khi data/height đổi, niceMax x1.15 để cột cao nhất không chạm trần.
//
// Vấn đề: viewBox cố định 760 đơn vị rồi để `w-full` co lại — ở màn 375px tỉ lệ tụt còn 0.399 nên
// fontSize 12 render ra 4.8px thật, nhãn cột và số trên đầu cột không đọc được.
// Giải pháp: đo bề rộng thật, đặt viewBox đúng bằng số đó nên 1 đơn vị SVG = 1 pixel. Cỡ chữ khai
// báo bao nhiêu thì hiện ra đúng bấy nhiêu ở mọi khổ màn. Lề trái và độ dài nhãn cũng co theo bề
// rộng — chỉ phóng chữ mà không giảm mật độ thì chữ to lên rồi chồng lên nhau.
export function BarChart({ data = [], color = CHART_RAMP[1], height = 300, valueSuffix = '', title, desc }) {
    const titleId = useId();
    const descId = useId();
    const [containerRef, width] = useChartWidth();

    const { bars, maxY, padding, innerW, innerH, maxChars } = useMemo(() => {
        // Dưới ~420px, lề trái 48 chiếm gần 1/6 bề ngang chỉ để chứa 2-3 chữ số trục Y.
        const padding = { top: 24, right: 16, bottom: 56, left: width < 420 ? 34 : 48 };
        const innerW = Math.max(0, width - padding.left - padding.right);
        const innerH = height - padding.top - padding.bottom;
        const maxVal = Math.max(1, ...data.map(d => d.value));
        const niceMax = Math.ceil(maxVal * 1.15);
        const slot = data.length ? innerW / data.length : 0;
        const barW = Math.min(56, slot * 0.65);

        // Cắt nhãn theo chỗ thật sự có, không cắt cứng 18 ký tự: ở 375px mỗi ô chỉ rộng ~50px mà
        // 18 ký tự cần ~112px, nhãn hai cột cạnh nhau sẽ đè lên nhau. ~6.2px là bề ngang trung bình
        // một ký tự Plus Jakarta Sans ở 12px. Tên đầy đủ vẫn còn trong tooltip và trong <desc>.
        const maxChars = Math.max(4, Math.floor(slot / 6.2));

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

        return { bars, maxY: niceMax, padding, innerW, innerH, maxChars };
    }, [data, height, width]);

    if (!data.length) {
        return <div className="h-64 flex items-center justify-center text-sm text-text-muted">Chưa có dữ liệu</div>;
    }

    const yTicks = 4;

    // <title>/<desc>: không có chúng thì screen reader chỉ thấy một khối SVG rỗng và toàn bộ
    // số liệu trong biểu đồ biến mất với người không nhìn được.
    const chartTitle = title || 'Biểu đồ cột';
    const chartDesc = desc || data.map(d => `${d.label}: ${d.value}${valueSuffix}`).join('. ') + '.';

    return (
        <div ref={containerRef} className="w-full">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                width={width}
                height={height}
                role="img"
                aria-labelledby={`${titleId} ${descId}`}
            >
                <title id={titleId}>{chartTitle}</title>
                <desc id={descId}>{chartDesc}</desc>

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

                {bars.map((b, i) => (
                    <g key={i}>
                        {/* rx 4px = bậc bo góc nhỏ nhất của hệ thống */}
                        <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={b.color || color} rx="4">
                            <title>{b.label}: {b.value}{valueSuffix}</title>
                        </rect>
                        <text x={b.x + b.w / 2} y={b.y - 6} textAnchor="middle" fontSize="13" fill={CHART_AXIS.valueText} fontWeight="600">
                            {b.value}{valueSuffix}
                        </text>
                        <text x={b.x + b.w / 2} y={height - 30} textAnchor="middle" fontSize="12" fill={CHART_AXIS.label}>
                            <tspan>{b.label.length > maxChars ? b.label.slice(0, maxChars) + '…' : b.label}</tspan>
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
}
