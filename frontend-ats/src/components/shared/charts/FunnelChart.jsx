// Vấn đề: Hiển thị funnel tuyển dụng với tỉ lệ chuyển đổi giữa các bước; bước có value=0 sẽ làm ratio chia 0.
// Giải pháp: max=1 fallback để width tính được; conv chỉ tính khi steps[i-1].value > 0; widthPct tối thiểu 6% để bước rất nhỏ vẫn nhìn thấy.
export function FunnelChart({ steps = [] }) {
    const max = Math.max(1, ...steps.map(s => s.value));

    return (
        <div className="space-y-4">
            {steps.map((s, i) => {
                const widthPct = Math.max(6, (s.value / max) * 100);
                const conv = i > 0 && steps[i - 1].value > 0
                    ? Math.round((s.value / steps[i - 1].value) * 1000) / 10
                    : null;
                return (
                    <div key={i}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                                <span className="text-xs font-black text-white bg-text-muted px-2 py-0.5 rounded-md uppercase tracking-wider">B{i + 1}</span>
                                <span className="font-bold text-text-main text-base">{s.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-black text-text-main text-lg">{s.value}</span>
                                {conv !== null && (
                                    <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${conv >= 50 ? 'bg-success/10 text-success' : conv >= 25 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>
                                        {conv}%
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="h-5 bg-surface rounded-full overflow-hidden">
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
