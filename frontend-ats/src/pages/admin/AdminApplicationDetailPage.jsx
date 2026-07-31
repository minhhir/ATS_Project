import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layout/AdminLayout';
import {
    User, Mail, Phone, Clock, FileText,
    AlertOctagon, ExternalLink, ChevronLeft,
    BrainCircuit, ShieldAlert, Trash2
} from 'lucide-react';
import api from '@/api/axios';
import { Button } from '@/ui/Button';

export function AdminApplicationDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [app, setApp] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const { data } = await api.get(`/admin/applications/${id}`);
                setApp(data.data);
            } catch (error) {
                console.error('Lỗi tải chi tiết đơn:', error);
                alert('Không tìm thấy thông tin đơn ứng tuyển');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    // Vấn đề: Trang đang là chi tiết của đơn vừa xoá, nếu giữ lại sẽ hiển thị data đã không tồn tại; phải báo cho candidate biết đơn bị xoá (BE đã xử lý notify).
    // Giải pháp: Confirm rồi xoá, navigate về /admin/dashboard để admin xử lý đơn tiếp theo, không quay lại history vì record đã không còn.
    const handleDeleteApplication = async () => {
        if (!window.confirm('Bạn có chắc muốn xóa đơn này vì vi phạm quy định?')) return;
        try {
            await api.delete(`/admin/applications/${id}`);
            alert('Đã xóa đơn ứng tuyển vi phạm');
            navigate('/admin/dashboard');
        } catch {
            alert('Lỗi khi xóa đơn');
        }
    };

    if (loading) return <AdminLayout><div className="text-center py-20 font-bold">Đang tải hồ sơ...</div></AdminLayout>;
    if (!app) return <AdminLayout><div className="text-center py-20 font-bold text-danger">Hồ sơ không tồn tại</div></AdminLayout>;

    return (
        <AdminLayout>
            {/* Header điều hướng */}
            {/* flex-col dưới sm: ở 375px, tiêu đề 28px và nút "Xóa đơn vi phạm" (không co được vì
                whitespace-nowrap) cộng lại vượt bề ngang, hai khối ép nhau méo chữ. Xếp dọc rồi mới
                cho về một hàng từ sm trở lên. */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-main mb-2 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                        <ChevronLeft size={18} aria-hidden="true" /> Quay lại
                    </button>
                    <h1 className="text-2xl font-bold text-text-main">Thẩm định hồ sơ</h1>
                </div>
                {/* Bo 8px (bậc button) thay vì 12px, và bỏ transition-all — chỉ màu nền đổi khi hover. */}
                <button
                    onClick={handleDeleteApplication}
                    className="inline-flex items-center justify-center gap-2 h-11 px-4 shrink-0 bg-danger text-white rounded-lg text-sm font-semibold hover:bg-danger-800 active:bg-danger-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 focus-visible:ring-offset-2"
                >
                    <Trash2 size={18} aria-hidden="true" /> Xóa đơn vi phạm
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cột trái: Thông tin ứng viên & CV */}
                <div className="lg:col-span-2 space-y-6">

                    {/* KHỐI CẢNH BÁO REPORT (Nếu có)
                        Token đặc thay nền opacity; viền 1px thay border-2; bỏ chữ IN HOA toàn phần —
                        đây là khối duy nhất tô màu danger trên trang nên nó đã nổi sẵn, hét thêm
                        bằng chữ hoa không làm admin thấy nhanh hơn. */}
                    {app.report?.isReported && (
                        <div className="bg-danger-50 border border-danger-100 p-5 rounded-lg">
                            <h4 className="text-danger-700 font-bold flex items-center gap-2">
                                <AlertOctagon size={18} className="shrink-0" aria-hidden="true" /> Đơn này bị báo cáo vi phạm
                            </h4>
                            <div className="mt-3 space-y-2">
                                <p className="text-sm text-text-main">
                                    <span className="text-text-muted">Lý do từ nhà tuyển dụng:</span> <br />
                                    <span className="text-danger-700">"{app.report.reason}"</span>
                                </p>
                                <p className="text-xs text-text-subtle flex items-center gap-1.5">
                                    <Clock size={14} className="shrink-0" aria-hidden="true" /> Gửi lúc {new Date(app.report.reportedAt).toLocaleString('vi-VN')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Preview CV & Thông tin nộp đơn */}
                    <div className="bg-surface-raised p-5 sm:p-6 rounded-lg border border-border">
                        <h3 className="text-lg font-bold text-text-main mb-5 flex items-center gap-2">
                            <FileText size={18} className="text-text-subtle shrink-0" aria-hidden="true" /> Nội dung ứng tuyển
                        </h3>
                        <div className="space-y-3">
                            {/* Ô con bên trong card: bo 4px, một bậc nhỏ hơn card bao ngoài (8px) — bo bằng
                                nhau sẽ trông như hai khối ngang hàng thay vì lồng nhau. flex-col dưới sm
                                vì tên file và nút không đủ chỗ trên một hàng ở 375px. */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-surface rounded-sm border border-border">
                                <div className="min-w-0">
                                    <p className="section-label">Tài liệu đính kèm</p>
                                    <p className="text-sm font-semibold text-text-main mt-0.5">Hồ sơ năng lực (CV.pdf)</p>
                                </div>
                                {/* Bỏ hover:scale-105: phóng to khi rê chuột là chuyển động trang trí,
                                    và nó làm nút nhích khỏi vị trí ngay lúc người dùng đang nhắm bấm. */}
                                <a
                                    href={app.cvUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 h-9 px-3 shrink-0 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                                >
                                    Mở file <ExternalLink size={16} aria-hidden="true" />
                                </a>
                            </div>

                            <div className="p-4 bg-surface rounded-sm border border-border">
                                <p className="section-label">Thông tin công việc</p>
                                <p className="text-base font-semibold text-text-main mt-1">{app.job?.title}</p>
                                <p className="text-sm text-text-muted mt-0.5">{app.job?.companyName}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cột phải: Profile chi tiết & AI Score */}
                <div className="space-y-6">
                    {/* User Card */}
                    <div className="bg-surface-raised p-5 rounded-lg border border-border text-center">
                        {/* alt rỗng cho ảnh đại diện: tên ứng viên đã nằm ngay dưới ảnh, đọc lại là thừa. */}
                        {/* Không có ảnh thì dùng icon người dùng trần, KHÔNG dùng chữ cái đầu trên nền tint:
                            chữ cái đầu là dữ liệu giả — nó trông như một thông tin nhưng không nói gì mà
                            dòng tên ngay bên dưới chưa nói. Icon nói đúng thứ nó là: chỗ này chưa có ảnh. */}
                        <div className="w-20 h-20 rounded-full border border-border overflow-hidden bg-surface mx-auto mb-3 flex items-center justify-center">
                            {app.candidate?.avatar ? (
                                <img src={app.candidate.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User size={28} className="text-text-subtle" aria-hidden="true" />
                            )}
                        </div>
                        <h3 className="text-base font-semibold text-text-main">{app.candidate?.name}</h3>
                        <p className="text-sm text-text-muted mb-5">Ứng viên</p>

                        {/* Icon trần đứng cạnh chữ, bỏ ô vuông nền tint bọc quanh: hai cái ô xám chỉ chiếm
                            chỗ và làm icon nặng hơn dòng chữ nó đang chú thích. */}
                        <div className="text-left space-y-3 border-t border-border pt-5">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <Mail size={16} className="text-text-subtle shrink-0" aria-hidden="true" />
                                <span className="text-sm text-text-main truncate">{app.candidate?.email}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Phone size={16} className="text-text-subtle shrink-0" aria-hidden="true" />
                                <span className="text-sm text-text-main">{app.candidate?.phone || 'Chưa cập nhật'}</span>
                            </div>
                        </div>
                    </div>

                    {/* AI Insights (Nếu đã chấm điểm) */}
                    {/* Vấn đề: khối này từng dùng `bg-dark`, một token đã bị xóa khỏi tailwind.config.js.
                        Class không tồn tại thì Tailwind bỏ qua im lặng, nên nền biến mất và toàn bộ chữ
                        trắng nằm trên nền trắng — điểm chấm CV, thứ HR mở hồ sơ để xem, vô hình hoàn toàn.
                        Giải pháp: token `surface-inverse` khai báo thật trong config. Bo 8px (bậc card,
                        không phải bậc modal) và bỏ shadow: khối này nằm phẳng trong cột phải, nó tách khỏi
                        các card khác bằng nền đảo chứ không phải bằng độ cao. */}
                    <div className="bg-surface-inverse p-6 rounded-lg text-white">
                        <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wide flex items-center gap-2 mb-4">
                            <BrainCircuit size={16} className="shrink-0" aria-hidden="true" /> Kết quả chấm điểm
                        </h4>
                        {/* /100 ở mức /40 chỉ đạt 3.81:1 trên nền Slate 900 — nó là đơn vị của điểm số,
                            tức văn bản thật, nên phải đạt 4.5:1. Lên /70 (9.10:1) vẫn đủ nhạt để không
                            tranh chấp với con số chính. */}
                        <div className="text-2xl font-bold tabular-nums mb-1">{app.score}<span className="text-sm font-normal text-white/70">/100</span></div>
                        <p className="text-xs text-white/60 mb-4">Điểm khớp giữa CV và mô tả công việc của tin đã nộp.</p>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                            <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${app.score}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
