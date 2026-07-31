import { Link } from 'react-router-dom';
import { MapPin, Wallet, Clock } from 'lucide-react';

// Vấn đề: Job card xuất hiện ở landing/search/related; nếu mỗi nơi tự render layout khác nhau sẽ vỡ design system; logo có thể null nên cần fallback.
// Giải pháp: Component dùng chung nhận prop job, fallback ui-avatars khi không có logo, Link tới /jobs/:id để click bất kỳ chỗ nào trên card cũng vào chi tiết.

// Phân cấp thông tin ở đây tạo bằng CÂN NẶNG và MÀU, không bằng cỡ chữ:
//   tên vị trí   16px / 600 / text-main   ← thứ ứng viên quét đầu tiên
//   tên công ty  14px / 400 / text-muted
//   lương-nơi-làm 12px / 500 / text-muted trong chip viền nhạt
//   kỹ năng      12px / 400 / text-subtle
// Cách này giữ được mật độ (card thấp, xem được nhiều tin một màn) mà vẫn rõ đâu là thông tin chính.
export function JobCard({ job }) {
    return (
        <Link
            to={`/jobs/${job.id}`}
            // Vấn đề: Thẻ <a> chỉ kích hoạt bằng Enter, không bằng Space. Người dùng bàn phím quen
            // dùng Space cho mọi thứ trông như nút bấm, và cả card này trông đúng như một nút.
            // Giải pháp: Bắt Space, preventDefault để trang không bị cuộn xuống, rồi click.
            onKeyDown={(e) => {
                if (e.key === ' ') {
                    e.preventDefault();
                    e.currentTarget.click();
                }
            }}
            className="group block bg-surface-raised border border-border rounded-lg p-4 transition-colors duration-200 ease-smooth hover:border-border-strong hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-sm border border-border bg-surface flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                        src={job.logo || `https://ui-avatars.com/api/?name=${job.company}&background=f1f5f9&color=475569`}
                        alt=""
                        className="w-full h-full object-contain"
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-text-main truncate group-hover:text-primary transition-colors">
                        {job.title}
                    </h3>
                    <p className="text-sm text-text-muted truncate mt-0.5">{job.company}</p>
                </div>

                {/* Trạng thái tin dùng một chấm màu thay vì khối nền tint: chấm đủ để nhận ra
                    trạng thái mà không chiếm mảng màu cạnh tranh với nút hành động chính. */}
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-text-muted shrink-0 pt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true" />
                    Đang tuyển
                </span>
            </div>

            {/* Chip viền nhạt, KHÔNG nền tint — nền tint ở ba chip cạnh nhau sẽ thành ba mảng màu
                đè lên nhau và làm card nặng hơn nội dung nó chứa. */}
            <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                    { icon: Wallet, value: job.salary },
                    { icon: MapPin, value: job.location },
                    { icon: Clock, value: job.type },
                ].filter(m => m.value).map(({ icon: Icon, value }) => (
                    <span
                        key={value}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-border text-xs font-medium text-text-muted"
                    >
                        {/* Icon để màu trung tính: tô icon bằng success/warning là dùng màu trạng
                            thái để trang trí, sau này màu mất nghĩa. */}
                        <Icon size={13} className="text-text-subtle shrink-0" aria-hidden="true" />
                        {value}
                    </span>
                ))}
            </div>

            {/* Kỹ năng là cấp thông tin thứ tư — để chữ trơn phân cách bằng dấu chấm giữa,
                không thêm một hàng chip nữa, tránh card có hai hàng chip trông giống nhau. */}
            {job.skills?.length > 0 && (
                <p className="mt-2.5 text-xs text-text-subtle truncate">
                    {job.skills.join(' · ')}
                </p>
            )}
        </Link>
    );
}
