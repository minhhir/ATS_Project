import { useMemo, useState } from 'react';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444'];

export function LineChart({ series = [], height = 240, formatX = (s) => s, yLabel }) {
    const [hover, setHover] = useState(null);

    const { lines, maxY, xLabels, n, padding, width, innerW, innerH } = useMemo(() => {
        const padding = { top: 16, right: 16, bottom: 28, left: 36 };
        const width = 720;
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
        return <div className="h-60 flex items-center justify-center text-text-muted text-sm font-medium">Chưa có dữ liệu</div>;
    }

    const yTicks = 4;

    return (
        <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
                {/* Grid + Y axis ticks */}
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

                {/* Area + Line */}
                {lines.map((s, idx) => (
                    <g key={idx}>
                        <path d={s.area} fill={s.color} opacity="0.08" />
                        <path d={s.path} stroke={s.color} strokeWidth="2.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                        {s.pts.map((p, i) => (
                            <circle
                                key={i}
                                cx={p.x}
                                cy={p.y}
                                r={hover && hover.seriesIdx === idx && hover.i === i ? 5 : 2.5}
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
                        <text key={i} x={x} y={height - 8} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">
                            {formatX(lbl)}
                        </text>
                    );
                })}

                {/* Tooltip */}
                {hover && (
                    <g pointerEvents="none">
                        <line x1={hover.x} x2={hover.x} y1={padding.top} y2={padding.top + innerH} stroke="#94a3b8" strokeDasharray="3 3" />
                        <rect x={Math.min(hover.x + 8, width - 110)} y={hover.y - 30} width="100" height="34" rx="6" fill="#0f172a" />
                        <text x={Math.min(hover.x + 8, width - 110) + 8} y={hover.y - 16} fontSize="10" fill="#94a3b8" fontWeight="700">{formatX(hover.label)}</text>
                        <text x={Math.min(hover.x + 8, width - 110) + 8} y={hover.y - 4} fontSize="12" fill="#fff" fontWeight="900">{hover.value}{yLabel ? ` ${yLabel}` : ''}</text>
                    </g>
                )}
            </svg>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-2 px-2">
                {lines.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                        <span className="text-xs font-bold text-text-muted">{s.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
