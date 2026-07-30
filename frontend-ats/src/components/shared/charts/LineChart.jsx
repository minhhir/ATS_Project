import { useMemo, useState } from 'react';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444'];

// Vấn đề: Cần biểu đồ trend đa series (vd users/jobs/applications theo ngày) nhưng không muốn import lib lớn; nhiều label X sẽ chen chúc đè nhau.
// Giải pháp: SVG thuần với area + line, hover state để show tooltip, sparse X labels (~6 mốc) để không bị tràn.
export function LineChart({ series = [], height = 320, formatX = (s) => s, yLabel }) {
    const [hover, setHover] = useState(null);

    const { lines, maxY, xLabels, n, padding, width, innerW, innerH } = useMemo(() => {
        const padding = { top: 20, right: 20, bottom: 36, left: 48 };
        const width = 760;
        const innerW = width - padding.left - padding.right;
        const innerH = height - padding.top - padding.bottom;
        const n = series[0]?.points?.length || 0;
        const maxVal = Math.max(1, ...series.flatMap(s => s.points.map(p => p.y)));
        const niceMax = Math.ceil(maxVal * 1.15);
        const xLabels = series[0]?.points?.map(p => p.x) || [];

        const lines = series.map((s, idx) => {
            const color = s.color || COLORS[idx % COLORS.length];
            const pts = s.points.map((p, i) => {
                const x = padding.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
                const y = padding.top + innerH - (p.y / niceMax) * innerH;
                return { x, y, raw: p };
            });
            const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            const area = `${path} L ${pts[pts.length - 1].x} ${padding.top + innerH} L ${pts[0].x} ${padding.top + innerH} Z`;
            return { ...s, color, pts, path, area };
        });

        return { lines, maxY: niceMax, xLabels, n, padding, width, innerW, innerH };
    }, [series, height]);

    if (!series.length || !n) {
        return <div className="h-80 flex items-center justify-center text-text-muted text-base font-medium">Chưa có dữ liệu</div>;
    }

    const yTicks = 4;

    return (
        <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                {/* Grid + Y axis ticks */}
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

                {/* Area + Line */}
                {lines.map((s, idx) => (
                    <g key={idx}>
                        <path d={s.area} fill={s.color} opacity="0.08" />
                        <path d={s.path} stroke={s.color} strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" />
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

                {/* X axis labels (sparse: ~6 ticks) */}
                {xLabels.map((lbl, i) => {
                    const stride = Math.max(1, Math.floor(n / 6));
                    if (i % stride !== 0 && i !== n - 1) return null;
                    const x = padding.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
                    return (
                        <text key={i} x={x} y={height - 10} textAnchor="middle" fontSize="13" fill="#475569" fontWeight="700">
                            {formatX(lbl)}
                        </text>
                    );
                })}

                {/* Tooltip */}
                {hover && (
                    <g pointerEvents="none">
                        <line x1={hover.x} x2={hover.x} y1={padding.top} y2={padding.top + innerH} stroke="#94a3b8" strokeDasharray="3 3" />
                        <rect x={Math.min(hover.x + 10, width - 130)} y={hover.y - 38} width="120" height="42" rx="8" fill="#0f172a" />
                        <text x={Math.min(hover.x + 10, width - 130) + 10} y={hover.y - 22} fontSize="12" fill="#94a3b8" fontWeight="700">{formatX(hover.label)}</text>
                        <text x={Math.min(hover.x + 10, width - 130) + 10} y={hover.y - 7} fontSize="15" fill="#fff" fontWeight="900">{hover.value}{yLabel ? ` ${yLabel}` : ''}</text>
                    </g>
                )}
            </svg>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-5 mt-3 px-2">
                {lines.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ background: s.color }} />
                        <span className="text-sm font-bold text-text-main">{s.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
