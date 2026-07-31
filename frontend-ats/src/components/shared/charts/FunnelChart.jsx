import { CHART_RAMP } from '@/utils/chartColors';

// Vấn đề: Hiển thị funnel tuyển dụng với tỉ lệ chuyển đổi giữa các bước; bước có value=0 sẽ làm ratio chia 0.
// Giải pháp: max=1 fallback để width tính được; conv chỉ tính khi steps[i-1].value > 0; widthPct tối thiểu 6% để bước rất nhỏ vẫn nhìn thấy.
//
// Màu mặc định lấy từ CHART_RAMP thay vì hex viết tay: bản cũ ghim cứng #0284c7 — đúng bước mà
// tailwind.config.js đã loại khỏi vai trò nền vì chữ trắng đặt lên chỉ đạt 4.10:1.
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
                            <div className="flex items-center gap-2.5 min-w-0">
                                {/* Số thứ tự để trần dạng chữ xám thay vì viên nền đặc: nó là nhãn định vị
                                    "bước thứ mấy", không phải trạng thái — tô nền đặc làm nó nặng ngang
                                    tên bước đứng cạnh. */}
                                <span className="text-xs font-semibold text-text-subtle tabular-nums shrink-0">{String(i + 1).padStart(2, '0')}</span>
                                <span className="text-sm font-semibold text-text-main truncate">{s.label}</span>
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0">
                                <span className="text-base font-bold text-text-main tabular-nums">{s.value}</span>
                                {/* Nhánh warning cũ (bg-warning/10 text-warning) chỉ đạt 4.39:1 — trượt AA, mà
                                    đây là tỉ lệ chuyển đổi giữa hai vòng tuyển, con số HR đọc để biết vòng nào
                                    đang rụng người. Cả ba nhánh đổi sang bộ token đặc -50/-700: nền opacity phụ
                                    thuộc màu phía sau nên tương phản không đoán trước được, và hai nhánh kia dù
                                    đã đạt vẫn nên đồng bộ để ba mức trông cùng một hệ. */}
                                {conv !== null && (
                                    <span className={`text-sm font-bold px-2.5 py-0.5 rounded-sm ${conv >= 50 ? 'bg-success-50 text-success-700' : conv >= 25 ? 'bg-warning-50 text-warning-700' : 'bg-danger-50 text-danger-700'}`}>
                                        {conv}%
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* Bo 4px thay vì tròn hai đầu: `full` là bậc dành cho avatar và chấm trạng thái.
                            Thanh thấp lại còn 16px để cả phễu 5 bước gọn hơn trong một màn. */}
                        <div className="h-4 bg-surface-sunken rounded-sm overflow-hidden">
                            <div
                                className="h-full rounded-sm transition-[width] duration-200 ease-smooth"
                                style={{ width: `${widthPct}%`, background: s.color || CHART_RAMP[0] }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
