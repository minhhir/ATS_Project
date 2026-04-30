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
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-text-muted hover:text-primary font-bold mb-2 transition-colors"
                    >
                        <ChevronLeft size={20} /> Quay lại
                    </button>
                    <h1 className="text-3xl font-black text-text-main">Thẩm định hồ sơ</h1>
                </div>
                <button
                    onClick={handleDeleteApplication}
                    className="flex items-center gap-2 px-6 py-3 bg-danger text-white rounded-2xl font-bold hover:bg-danger/90 transition-all shadow-lg shadow-danger/20"
                >
                    <Trash2 size={20} /> Xóa đơn vi phạm
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cột trái: Thông tin ứng viên & CV */}
                <div className="lg:col-span-2 space-y-6">

                    {/* KHỐI CẢNH BÁO REPORT (Nếu có) */}
                    {app.report?.isReported && (
                        <div className="bg-danger/5 border-2 border-danger/20 p-6 rounded-3xl">
                            <h4 className="text-danger font-black flex items-center gap-2 text-lg">
                                <AlertOctagon size={24} /> PHÁT HIỆN BÁO CÁO VI PHẠM
                            </h4>
                            <div className="mt-4 space-y-2">
                                <p className="text-text-main font-medium">
                                    <span className="text-text-muted font-bold">Lý do từ Nhà tuyển dụng:</span> <br />
                                    <span className="text-lg italic text-danger">"{app.report.reason}"</span>
                                </p>
                                <p className="text-sm text-text-muted flex items-center gap-1 font-bold">
                                    <Clock size={14} /> Gửi vào lúc: {new Date(app.report.reportedAt).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Preview CV & Thông tin nộp đơn */}
                    <div className="bg-white p-8 rounded-3xl border border-border shadow-sm">
                        <h3 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
                            <FileText className="text-primary" /> Nội dung ứng tuyển
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-surface rounded-2xl border border-border">
                                <div>
                                    <p className="text-xs font-bold text-text-muted uppercase">Tài liệu đính kèm</p>
                                    <p className="font-bold text-text-main">Hồ sơ năng lực (CV.pdf)</p>
                                </div>
                                <a
                                    href={app.cvUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-bold hover:scale-105 transition-transform"
                                >
                                    Mở File <ExternalLink size={16} />
                                </a>
                            </div>

                            <div className="p-4 bg-surface rounded-2xl border border-border">
                                <p className="text-xs font-bold text-text-muted uppercase mb-2">Thông tin công việc</p>
                                <p className="font-bold text-text-main text-lg">{app.job?.title}</p>
                                <p className="text-sm text-primary font-bold">Công ty: {app.job?.companyName}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cột phải: Profile chi tiết & AI Score */}
                <div className="space-y-6">
                    {/* User Card */}
                    <div className="bg-white p-6 rounded-3xl border border-border shadow-sm text-center">
                        <div className="w-24 h-24 rounded-full border-4 border-surface overflow-hidden bg-surface mx-auto mb-4 shadow-inner">
                            {app.candidate?.avatar ? (
                                <img src={app.candidate.avatar} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-primary text-3xl bg-primary/5">
                                    {app.candidate?.name?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <h3 className="text-xl font-black text-text-main">{app.candidate?.name}</h3>
                        <p className="text-sm text-text-muted font-bold mb-6">Ứng viên hệ thống</p>

                        <div className="text-left space-y-4 border-t border-border pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-surface rounded-lg text-text-muted"><Mail size={18} /></div>
                                <span className="text-sm font-bold truncate">{app.candidate?.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-surface rounded-lg text-text-muted"><Phone size={18} /></div>
                                <span className="text-sm font-bold">{app.candidate?.phone || 'Chưa cập nhật'}</span>
                            </div>
                        </div>
                    </div>

                    {/* AI Insights (Nếu đã chấm điểm) */}
                    <div className="bg-dark p-6 rounded-3xl shadow-lg shadow-dark/20 text-white">
                        <h4 className="text-sm font-bold text-white/50 uppercase flex items-center gap-2 mb-4">
                            <BrainCircuit size={18} /> Kết quả phân tích AI
                        </h4>
                        <div className="text-4xl font-black mb-1">{app.score}<span className="text-sm text-white/40">/100</span></div>
                        <p className="text-xs font-medium text-white/60 mb-4 italic">Điểm tương thích dựa trên kỹ năng và JD thực tế</p>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                            <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${app.score}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
