import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RecruiterLayout } from '@/layout/RecruiterLayout';
import { BrainCircuit, FileText, CheckCircle, XCircle, Clock, User, AlertTriangle } from 'lucide-react';
import api from '@/api/axios';
import { Button } from '@/ui/Button';

export function CandidatesManagePage() {
    const [searchParams] = useSearchParams();
    const initialJobId = searchParams.get('jobId') || 'all';

    const [applications, setApplications] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(initialJobId);
    const [loading, setLoading] = useState(true);

    // Lấy danh sách Job đưa vào Dropdown
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const { data } = await api.get('/jobs/recruiter');
                setJobs(data.data);
            } catch { console.error('Lỗi lấy Jobs'); }
        };
        fetchJobs();
    }, []);

    // Lấy danh sách Ứng viên theo Job
    useEffect(() => {
        const fetchApps = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/applications/job/${selectedJob}`);
                setApplications(data.data);
            } catch { console.error('Lỗi lấy Ứng viên'); }
            setLoading(false);
        };
        fetchApps();
    }, [selectedJob]);

    // Đổi trạng thái (Đang chờ, Từ chối, Nhận...)
    const handleStatusChange = async (appId, status) => {
        try {
            await api.patch(`/applications/${appId}/status`, { status });
            setApplications(apps => apps.map(app => app._id === appId ? { ...app, status } : app));
        } catch { alert('Lỗi cập nhật trạng thái'); }
    };
    // Báo cáo ứng viên (CV giả mạo, thông tin sai lệch...)
    const handleReport = async (appId) => {
        const reason = window.prompt('Nhập lý do báo cáo ứng viên này (v dụ: CV giả mạo, thông tin sai lệch):');
        if (!reason) return;

        try {
            await api.post(`/applications/${appId}/report`, { reason });
            alert('Đã gửi báo cáo cho Quản trị viên xử lý!');
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi gửi báo cáo');
        }
    };
    // Chấm lại điểm AI (chạy nền, poll lại danh sách sau vài giây)
    const handleReScore = async (appId) => {
        try {
            await api.post(`/applications/${appId}/score`);
            setApplications(apps => apps.map(app => app._id === appId ? { ...app, aiStatus: 'processing' } : app));
            alert('Đang gửi CV sang server Python để phân tích. Điểm sẽ tự cập nhật sau 5-10 giây.');
            setTimeout(async () => {
                try {
                    const { data } = await api.get(`/applications/job/${selectedJob}`);
                    setApplications(data.data);
                } catch { /* bỏ qua */ }
            }, 8000);
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi! Hãy kiểm tra Terminal Node.js và Python.');
        }
    };

    return (
        <RecruiterLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-black text-text-main">Quản lý ứng viên</h1>
                <p className="text-text-muted mt-1 font-medium">Đánh giá và phản hồi hồ sơ ứng tuyển của bạn.</p>
            </div>

            {/* Thanh công cụ */}
            <div className="bg-white p-4 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row gap-4 mb-8">
                <select
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-border bg-surface font-bold outline-none focus:ring-2 focus:ring-primary/20"
                >
                    <option value="all">Tất cả tin tuyển dụng</option>
                    {jobs.map(job => (
                        <option key={job._id} value={job._id}>{job.title}</option>
                    ))}
                </select>
            </div>

            {/* Danh sách ứng viên */}
            {loading ? (
                <div className="text-center py-10 font-bold text-text-muted">Đang tải dữ liệu...</div>
            ) : applications.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-border">
                    <User size={48} className="mx-auto text-border mb-4" />
                    <h3 className="text-xl font-bold text-text-main">Chưa có ứng viên nào</h3>
                    <p className="text-text-muted mt-2">Hãy chờ đợi thêm hoặc chia sẻ tin tuyển dụng nhé!</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {applications.map(app => (
                        <div key={app._id} className="bg-white p-6 rounded-3xl border border-border shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">

                            {/* Thông tin Ứng viên */}
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-14 h-14 rounded-full border border-border overflow-hidden bg-surface shrink-0">
                                    {app.candidate?.avatar ? (
                                        <img src={app.candidate.avatar} className="w-full h-full object-cover" alt="Avatar" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-primary text-xl">
                                            {app.candidate?.name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-text-main">{app.candidate?.name}</h4>
                                    <div className="text-sm text-text-muted flex items-center gap-2">
                                        <Clock size={14} /> Nộp cho vị trí: <span className="font-semibold text-primary">{app.job?.title}</span>
                                    </div>

                                    {/* Nhóm các nút thao tác nhanh dưới tên */}
                                    <div className="flex items-center gap-4 mt-2">
                                        <a href={app.cvUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary inline-flex items-center gap-1 hover:underline">
                                            <FileText size={16} /> Xem CV PDF
                                        </a>

                                        {/* NÚT BÁO CÁO Ở ĐÂY - Trông sẽ gọn và chuyên nghiệp hơn */}
                                        <button
                                            onClick={() => handleReport(app._id)}
                                            className="flex items-center gap-1 text-sm font-bold text-danger hover:text-danger/80 transition-colors"
                                            title="Báo cáo ứng viên này với Admin"
                                        >
                                            <AlertTriangle size={16} /> Báo cáo CV Fake
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Điểm AI */}
                            <div className="flex flex-col items-center">
                                <div className="text-xs font-bold text-text-muted uppercase mb-1 flex items-center gap-1">
                                    <BrainCircuit size={14} /> Điểm AI
                                </div>
                                {app.aiStatus === 'processing' || app.aiStatus === 'pending' ? (
                                    <div className="text-sm font-bold text-text-muted italic">Đang xử lý...</div>
                                ) : app.aiStatus === 'error' ? (
                                    <div className="text-sm font-bold text-danger">Lỗi</div>
                                ) : (
                                    <div className={`text-3xl font-black ${app.aiScore >= 80 ? 'text-success' : app.aiScore >= 50 ? 'text-warning' : 'text-danger'}`}>
                                        {app.aiScore ?? 0}<span className="text-sm text-text-muted">/100</span>
                                    </div>
                                )}
                                {(app.aiStatus === 'error' || (app.aiStatus === 'done' && (app.aiScore ?? 0) === 0)) && (
                                    <button onClick={() => handleReScore(app._id)} className="text-xs font-bold text-primary mt-1 hover:underline">
                                        Chấm lại
                                    </button>
                                )}
                            </div>
                            {/* Cập nhật trạng thái */}
                            <div className="w-full md:w-48">
                                <select
                                    value={app.status}
                                    onChange={(e) => handleStatusChange(app._id, e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border-2 font-bold outline-none transition-colors ${app.status === 'pending' ? 'border-warning/30 bg-warning/10 text-warning' :
                                        app.status === 'accepted' ? 'border-success/30 bg-success/10 text-success' :
                                            'border-danger/30 bg-danger/10 text-danger'
                                        }`}
                                >
                                    <option value="applied">Chờ duyệt (Applied)</option>
                                    <option value="reviewing">Đang xem xét (Reviewing)</option>
                                    <option value="shortlisted">Danh sách rút gọn (Shortlisted)</option>
                                    <option value="interviewed">Phỏng vấn (Interviewed)</option>
                                    <option value="offered">Trúng tuyển (Offered)</option>
                                    <option value="rejected">Từ chối (Rejected)</option>
                                </select>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </RecruiterLayout>
    );
}