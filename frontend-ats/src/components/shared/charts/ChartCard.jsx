// Vấn đề: Mỗi chart trên dashboard cần khung trắng + title + subtitle + action; copy-paste sẽ lệch design giữa các chart.
// Giải pháp: ChartCard wrapper chuẩn hoá padding/border/header để mọi biểu đồ chỉ cần render content vào children.
export function ChartCard({ title, subtitle, action, children, className = '' }) {
    return (
        <div className={`bg-white rounded-3xl border border-border shadow-sm p-7 ${className}`}>
            <div className="flex items-start justify-between gap-3 mb-6">
                <div>
                    <h3 className="text-xl font-black text-text-main">{title}</h3>
                    {subtitle && <p className="text-sm font-medium text-text-muted mt-1">{subtitle}</p>}
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}
