import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CandidateLayout } from '@/layout/CandidateLayout';
import { Badge } from '@/ui/Badge';
import { SkeletonCard } from '@/ui/Skeleton';
import api from '@/api/axios';
import { MapPin, Clock, ArrowRight } from 'lucide-react';

export function ApplicationsPage() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyApps = async () => {
            try {
                const { data } = await api.get('/applications/me');
                setApplications(data.data);
            } catch (error) {
                console.error('Lỗi khi tải lịch sử nộp đơn', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMyApps();
    }, []);

    // Vấn đề: Status từ BE là enum tiếng Anh, hiển thị thẳng cho candidate sẽ khó hiểu; mỗi status cần màu riêng để user nhận diện trạng thái nhanh.
    // Giải pháp: Map config (label tiếng Việt + variant của Badge) theo status, fallback về 'applied' nếu BE thêm status mới mà FE chưa update.
    //
    // Trước đây mỗi trạng thái dùng một hue riêng (blue / amber / purple / emerald / red) — năm màu
    // ngoài bảng màu hệ thống. Giờ gom về 4 variant có nghĩa thật, phân biệt thêm bằng chấm màu:
    //   neutral → chưa có tiến triển   warning → đang chờ người khác xử lý
    //   success → kết quả tốt          danger  → kết thúc, không đạt
    const getStatusConfig = (status) => {
        const configs = {
            applied: { label: 'Mới nộp', variant: 'neutral' },
            reviewing: { label: 'Đang xem xét', variant: 'warning' },
            shortlisted: { label: 'Đã vào danh sách ngắn', variant: 'primary' },
            interviewed: { label: 'Đã phỏng vấn', variant: 'primary' },
            offered: { label: 'Đã nhận offer', variant: 'success' },
            rejected: { label: 'Không được chọn', variant: 'danger' }
        };
        return configs[status] || configs.applied;
    };

    return (
        <CandidateLayout>
            <div>
                <h1 className="text-2xl font-semibold text-text-main">Đơn đã nộp</h1>
                <p className="text-sm text-text-muted mt-1">
                    Theo dõi trạng thái từng hồ sơ bạn đã gửi và điểm khớp mà hệ thống tính được.
                </p>
            </div>

            {loading ? (
                <div className="space-y-3" aria-busy="true" aria-label="Đang tải danh sách đơn đã nộp">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : applications.length === 0 ? (
                // Copy cụ thể theo nghiệp vụ: nói rõ ứng viên chưa làm việc gì và bước tiếp theo là gì,
                // thay cho câu quảng cáo "Hàng ngàn cơ hội đang chờ đón bạn".
                <div className="border border-border rounded-lg bg-surface-raised p-10 max-w-xl">
                    <h2 className="text-base font-semibold text-text-main">
                        Bạn chưa nộp hồ sơ cho vị trí nào
                    </h2>
                    <p className="text-sm text-text-muted mt-2">
                        Khi bạn nộp CV cho một tin tuyển dụng, đơn sẽ xuất hiện ở đây kèm trạng thái do
                        nhà tuyển dụng cập nhật — từ lúc mới nộp đến khi có kết quả.
                    </p>
                    <Link
                        to="/candidate/jobs"
                        className="inline-flex items-center justify-center h-11 px-4 mt-5 rounded-lg bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                    >
                        Xem việc làm đang tuyển
                    </Link>
                </div>
            ) : (
                // Danh sách một cột: mỗi đơn là một dòng thông tin cần đọc theo thứ tự
                // (trạng thái → vị trí → điểm khớp), không phải ô lưới để so sánh song song.
                <ul className="space-y-3">
                    {applications.map((app) => {
                        const job = app.job;
                        const company = job?.recruiter;
                        const statusCfg = getStatusConfig(app.status);

                        return (
                            <li key={app._id} className="border border-border rounded-lg bg-surface-raised p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <Badge variant={statusCfg.variant} dot>{statusCfg.label}</Badge>
                                    <span className="text-xs text-text-subtle">
                                        Nộp ngày {app.createdAt ? new Date(app.createdAt).toLocaleDateString('vi-VN') : 'không rõ'}
                                    </span>
                                </div>

                                <div className="flex items-start gap-3 mt-3">
                                    <div className="w-10 h-10 rounded-sm border border-border bg-surface flex items-center justify-center shrink-0 overflow-hidden">
                                        <img
                                            src={company?.companyLogo || `https://ui-avatars.com/api/?name=${company?.companyName || 'C'}&background=f1f5f9&color=475569`}
                                            alt=""
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-base font-semibold text-text-main truncate">
                                            {job?.title || 'Tin tuyển dụng đã bị xóa'}
                                        </h3>
                                        <p className="text-sm text-text-muted truncate mt-0.5">
                                            {company?.companyName || 'Công ty ẩn danh'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-border text-xs font-medium text-text-muted">
                                        <MapPin size={13} className="text-text-subtle shrink-0" aria-hidden="true" />
                                        {job?.location || 'Không rõ'}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-border text-xs font-medium text-text-muted">
                                        <Clock size={13} className="text-text-subtle shrink-0" aria-hidden="true" />
                                        {job?.type || 'Không rõ'}
                                    </span>
                                </div>

                                <div className="mt-4 pt-3 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3">
                                    {/* Điểm khớp: nhãn nhỏ ở trên, số đậm ở dưới. Bỏ khối icon Zap bọc
                                        nền tint — con số đã là thứ cần đọc, icon chỉ thêm nhiễu. */}
                                    <div>
                                        <div className="text-xs text-text-subtle">Điểm hệ thống chấm CV</div>
                                        {app.aiStatus === 'done' ? (
                                            <div className="text-sm font-semibold text-text-main mt-0.5">
                                                {app.aiScore}
                                                <span className="text-text-subtle font-normal"> / 100</span>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-text-muted mt-0.5">Đang chấm, thường mất vài phút</div>
                                        )}
                                    </div>

                                    {/* Vấn đề: Trước đây là <Link><Button/></Link> — lồng <button> trong <a>
                                        là HTML không hợp lệ; và khi job đã bị xóa thì Link vẫn trỏ tới '#'
                                        nên vẫn bấm được dù nút bên trong đã disabled.
                                        Giải pháp: Không có job thì render chữ trơn, không render link. */}
                                    {job ? (
                                        <Link
                                            to={`/jobs/${job._id}`}
                                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-white text-sm font-semibold text-text-main transition-colors hover:bg-surface hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                                        >
                                            Xem lại tin <ArrowRight size={15} aria-hidden="true" />
                                        </Link>
                                    ) : (
                                        <span className="text-xs text-text-subtle">Tin đã bị xóa, không xem lại được</span>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </CandidateLayout>
    );
}
