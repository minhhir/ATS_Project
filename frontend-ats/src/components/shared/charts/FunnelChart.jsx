export function FunnelChart({ steps = [] }) {
    const max = Math.max(1, ...steps.map(s => s.value));

    return (
        <div className="space-y-3">
            {steps.map((s, i) => {
                const widthPct = Math.max(6, (s.value / max) * 100);
                const conv = i > 0 && steps[i - 1].value > 0
                    ? Math.round((s.value / steps[i - 1].value) * 1000) / 10
                    : null;
                return (
                    <div key={i}>
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-text-muted uppercase tracking-wider">B{i + 1}.</span>
                                <span className="font-bold text-text-main text-sm">{s.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-black text-text-main">{s.value}</span>
                                {conv !== null && (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${conv >= 50 ? 'bg-success/10 text-success' : conv >= 25 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>
                                        {conv}%
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="h-3 bg-surface rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${widthPct}%`, background: s.color || '#0284c7' }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
