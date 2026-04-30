export function ChartCard({ title, subtitle, action, children, className = '' }) {
    return (
        <div className={`bg-white rounded-3xl border border-border shadow-sm p-6 ${className}`}>
            <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                    <h3 className="text-lg font-black text-text-main">{title}</h3>
                    {subtitle && <p className="text-sm font-medium text-text-muted mt-0.5">{subtitle}</p>}
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}
