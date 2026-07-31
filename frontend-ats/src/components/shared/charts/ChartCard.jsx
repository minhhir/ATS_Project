// Vấn đề: Mỗi chart trên dashboard cần khung trắng + title + subtitle + action; copy-paste sẽ lệch design giữa các chart.
// Giải pháp: ChartCard wrapper chuẩn hoá padding/border/header để mọi biểu đồ chỉ cần render content vào children.
// Phân vùng bằng viền 1px, không shadow — card tĩnh không nổi lên trên mặt phẳng nào.
export function ChartCard({ title, subtitle, action, children, className = '' }) {
    return (
        <div className={`border border-border rounded-lg bg-surface-raised ${className}`}>
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border-subtle">
                <div className="min-w-0">
                    <h3 className="text-base font-semibold text-text-main">{title}</h3>
                    {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
                </div>
                {action}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}
