import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CandidateLayout } from '@/layout/CandidateLayout';
import { Button } from '@/ui/Button';
import api from '@/api/axios';
import { Building, MapPin, Clock, FileText, Loader2, Zap, ArrowRight, Briefcase } from 'lucide-react';

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

    const getStatusConfig = (status) => {
        const configs = {
            applied: { label: 'Mới nộp', style: 'bg-surface text-text-muted border-border' },
            reviewing: { label: 'Đang xem xét', style: 'bg-blue-50 text-blue-600 border-blue-200' },
            shortlisted: { label: 'Đã chọn lọc', style: 'bg-amber-50 text-amber-600 border-amber-200' },
            interviewed: { label: 'Đã phỏng vấn', style: 'bg-purple-50 text-purple-600 border-purple-200' },
            offered: { label: 'Đã cấp Offer', style: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
            rejected: { label: 'Từ chối', style: 'bg-red-50 text-red-600 border-red-200' }
        };
        return configs[status] || configs.applied;
    };

    return (
        <CandidateLayout>
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main">Đơn đã nộp</h1>
                <p className="text-text-muted mt-1 font-medium">Theo dõi tiến độ và kết quả các vị trí bạn đã ứng tuyển.</p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-primary bg-white rounded-2xl border border-border">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p className="font-medium">Đang tải dữ liệu...</p>
                </div>
            ) : applications.length === 0 ? (
                <div className="bg-white rounded-2xl border border-border p-16 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6">
                        <FileText className="w-10 h-10 text-text-muted" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-main mb-2">Bạn chưa ứng tuyển công việc nào</h2>
                    <p className="text-text-muted mb-8 max-w-md mx-auto">Hàng ngàn cơ hội việc làm hấp dẫn đang chờ đón bạn. Hãy khám phá và nộp CV ngay hôm nay!</p>
                    <Link to="/jobs">
                        <Button className="px-8"><Briefcase className="mr-2" size={18} /> Tìm việc ngay</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {applications.map((app) => {
                        const job = app.job;
                        const company = job?.recruiter;
                        const statusCfg = getStatusConfig(app.status);

                        return (
                            <div key={app._id} className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">

                                {/* Trạng thái đơn */}
                                <div className="flex justify-between items-start mb-5">
                                    <span className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${statusCfg.style}`}>
                                        Trạng thái: {statusCfg.label}
                                    </span>
                                    <div className="text-xs font-medium text-text-muted">
                                        Nộp ngày: {app.createdAt ? new Date(app.createdAt).toLocaleDateString('vi-VN') : 'Không rõ'}
                                    </div>
                                </div>

                                {/* Thông tin Job */}
                                <div className="flex gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-xl border border-border bg-surface p-2 shrink-0 flex items-center justify-center">
                                        <img
                                            src={company?.companyLogo || `https://ui-avatars.com/api/?name=${company?.companyName || 'C'}&background=e0f2fe&color=0284c7`}
                                            alt="Logo"
                                            className="w-full h-full object-contain rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-text-main leading-tight mb-1 group-hover:text-primary transition-colors">
                                            {job?.title || 'Tin tuyển dụng đã bị xóa'}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-text-muted font-medium text-sm">
                                            <Building size={16} />
                                            <span className="truncate max-w-[150px]">{company?.companyName || 'Công ty ẩn danh'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3 mb-6">
                                    <div className="flex items-center gap-1.5 text-xs text-text-muted bg-surface px-2.5 py-1.5 rounded-md font-medium">
                                        <MapPin size={14} className="text-primary" /> {job?.location || 'Không rõ'}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-text-muted bg-surface px-2.5 py-1.5 rounded-md font-medium">
                                        <Clock size={14} className="text-primary" /> {job?.type || 'Không rõ'}
                                    </div>
                                </div>

                                {/* ĐIỂM AI & Nút Action */}
                                <div className="pt-5 border-t border-border flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center text-primary">
                                            <Zap size={16} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-text-muted">Điểm AI phân tích</div>
                                            {app.aiStatus === 'done' ? (
                                                <div className={`font-black text-sm ${app.aiScore >= 80 ? 'text-success' : app.aiScore >= 50 ? 'text-warning' : 'text-danger'}`}>
                                                    {app.aiScore} / 100
                                                </div>
                                            ) : (
                                                <div className="text-sm font-semibold text-text-main">Đang chờ xử lý...</div>
                                            )}
                                        </div>
                                    </div>

                                    <Link to={job ? `/jobs/${job._id}` : '#'}>
                                        <Button variant="outline" className="text-sm px-4 py-2" disabled={!job}>
                                            Xem lại tin <ArrowRight size={16} className="ml-1" />
                                        </Button>
                                    </Link>
                                </div>

                            </div>
                        );
                    })}
                </div>
            )}
        </CandidateLayout>
    );
}