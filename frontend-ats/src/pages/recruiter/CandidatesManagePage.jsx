import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom'; // ✅ FIX 1: Đã import useParams
import { RecruiterLayout } from '@/layout/RecruiterLayout';
import { Button } from '@/ui/Button';
import {
    FileText, User, MapPin, Calendar, ExternalLink, Briefcase,
    CheckCircle, XCircle, Search, Filter, SortDesc, SortAsc
} from 'lucide-react';
import api from '@/api/axios';

export function CandidatesManagePage() {
    const location = useLocation();
    const { jobId: paramJobId } = useParams();

    // Lấy jobId từ URL (Hỗ trợ cả 2 dạng: /candidates?jobId=123 HOẶC /jobs/123/applicants)
    const queryParams = new URLSearchParams(location.search);
    const initialJobId = paramJobId || queryParams.get('jobId');

    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(initialJobId || '');
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);

    // ==========================================
    // ✅ STATE DÀNH RIÊNG CHO BỘ LỌC (FILTERS)
    // ==========================================
    const [searchTerm, setSearchTerm] = useState('');
    const [scoreFilter, setScoreFilter] = useState('all');
    const [dateSort, setDateSort] = useState('desc');

    // Lấy danh sách Job của HR này
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const { data } = await api.get('/jobs/my-jobs');
                setJobs(data.data);
                // ✅ FIX 2: Thay selectedJob bằng initialJobId để tránh Infinite Loop
                if (data.data.length > 0 && !initialJobId) {
                    setSelectedJob(data.data[0]._id);
                }
            } catch (error) {
                console.error('Lỗi lấy danh sách công việc', error);
            }
        };
        fetchJobs();
    }, []); // ✅ FIX 2: Dependency array rỗng, chỉ chạy 1 lần khi mount

    // Lấy danh sách Ứng viên khi chọn 1 Job
    useEffect(() => {
        if (!selectedJob) return;
        const fetchCandidates = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/applications/job/${selectedJob}`);
                setCandidates(data.data);
            } catch (error) {
                console.error('Lỗi lấy danh sách ứng viên', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCandidates();
    }, [selectedJob]);

    // ✅ FIX 3: Gọi API cập nhật trạng thái CV
    const handleUpdateStatus = async (appId, status) => {
        try {
            await api.patch(`/applications/${appId}/status`, { status });
            // Cập nhật local state để UI phản hồi ngay lập tức
            setCandidates(prev =>
                prev.map(app => app._id === appId ? { ...app, status } : app)
            );
        } catch (err) {
            console.error('Lỗi cập nhật trạng thái:', err);
            alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
        }
    };

    // ==========================================
    // ✅ LOGIC LỌC VÀ SẮP XẾP
    // ==========================================
    const filteredAndSortedCandidates = useMemo(() => {
        let result = [...candidates];

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(app =>
                app.candidate?.name?.toLowerCase().includes(lowerSearch) ||
                app.candidate?.email?.toLowerCase().includes(lowerSearch)
            );
        }

        if (scoreFilter !== 'all') {
            result = result.filter(app => {
                const score = app.aiScore || 0;
                if (scoreFilter === 'high') return score >= 80;
                if (scoreFilter === 'medium') return score >= 50 && score < 80;
                if (scoreFilter === 'low') return score < 50;
                return true;
            });
        }

        result.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateSort === 'desc' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [candidates, searchTerm, scoreFilter, dateSort]);


    // Helper UI: Màu sắc cho điểm AI
    const getScoreColor = (score) => {
        if (!score) return 'bg-surface text-text-muted border-border';
        if (score >= 80) return 'bg-success/10 text-success border-success/20';
        if (score >= 50) return 'bg-warning/10 text-warning border-warning/20';
        return 'bg-danger/10 text-danger border-danger/20';
    };

    // Helper UI: Hiển thị nhãn trạng thái CV
    const getStatusBadge = (status) => {
        if (status === 'shortlisted' || status === 'interviewed' || status === 'offered') {
            return <span className="px-2 py-0.5 rounded-md bg-success/10 text-success text-xs font-bold border border-success/20">Đã duyệt</span>;
        }
        if (status === 'rejected') {
            return <span className="px-2 py-0.5 rounded-md bg-danger/10 text-danger text-xs font-bold border border-danger/20">Đã từ chối</span>;
        }
        return <span className="px-2 py-0.5 rounded-md bg-surface text-text-muted text-xs font-bold border border-border">Chờ xử lý</span>;
    };

    return (
        <RecruiterLayout>
            <div className="mb-8">
                <h1 className="text-2xl font-black text-text-main mb-2">Quản lý Ứng viên</h1>
                <p className="text-text-muted font-medium">Xem xét, lọc và đánh giá hồ sơ ứng tuyển từ hệ thống AI.</p>
            </div>

            {/* Chọn Job để xem */}
            <div className="bg-white p-6 rounded-2xl border border-border mb-6 shadow-sm">
                <label className="block text-sm font-bold text-text-main mb-3">Chọn tin tuyển dụng để xem ứng viên:</label>
                <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                    <select
                        value={selectedJob}
                        onChange={(e) => setSelectedJob(e.target.value)}
                        className="w-full sm:w-1/2 pl-12 pr-4 py-3 rounded-xl border border-border bg-surface font-semibold text-text-main focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer appearance-none"
                    >
                        {jobs.length === 0 ? (
                            <option value="">Bạn chưa có tin tuyển dụng nào</option>
                        ) : (
                            jobs.map(job => (
                                <option key={job._id} value={job._id}>
                                    {job.title} ({job.applicantCount || 0} hồ sơ)
                                </option>
                            ))
                        )}
                    </select>
                </div>
            </div>

            {/* THANH CÔNG CỤ TÌM KIẾM & LỌC */}
            {candidates.length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-border mb-6 shadow-sm flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm tên hoặc email ứng viên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-border bg-surface font-medium text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="relative min-w-[160px]">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                            <select
                                value={scoreFilter}
                                onChange={(e) => setScoreFilter(e.target.value)}
                                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-border bg-surface font-semibold text-sm cursor-pointer outline-none appearance-none"
                            >
                                <option value="all">Mọi mức điểm AI</option>
                                <option value="high">Điểm cao (≥ 80)</option>
                                <option value="medium">Khá (50 - 79)</option>
                                <option value="low">Chưa đạt ({"<"} 50)</option>
                            </select>
                        </div>

                        <button
                            onClick={() => setDateSort(prev => prev === 'desc' ? 'asc' : 'desc')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-border/50 font-semibold text-sm transition-colors text-text-main"
                        >
                            {dateSort === 'desc' ? <SortDesc size={16} className="text-primary" /> : <SortAsc size={16} className="text-primary" />}
                            {dateSort === 'desc' ? 'Mới nhất' : 'Cũ nhất'}
                        </button>
                    </div>
                </div>
            )}

            {/* Danh sách ứng viên */}
            {loading ? (
                <div className="text-center py-20 text-text-muted font-semibold">Đang tải danh sách...</div>
            ) : !selectedJob ? (
                <div className="text-center py-20 text-text-muted">Vui lòng chọn một công việc để xem.</div>
            ) : candidates.length === 0 ? (
                <div className="bg-white rounded-2xl border border-border p-16 text-center">
                    <User className="w-12 h-12 text-text-muted/50 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-text-main mb-2">Chưa có ứng viên nào</h3>
                    <p className="text-text-muted">Khi có người nộp CV, hồ sơ sẽ xuất hiện tại đây.</p>
                </div>
            ) : filteredAndSortedCandidates.length === 0 ? (
                <div className="bg-white rounded-2xl border border-border p-16 text-center">
                    <Search className="w-12 h-12 text-text-muted/50 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-text-main mb-2">Không tìm thấy ứng viên phù hợp</h3>
                    <p className="text-text-muted mb-4">Hãy thử thay đổi điều kiện tìm kiếm và lọc.</p>
                    <Button variant="outline" onClick={() => { setSearchTerm(''); setScoreFilter('all'); }}>Xóa bộ lọc</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredAndSortedCandidates.map((app) => (
                        <div key={app._id} className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow">

                            <div className="flex justify-between items-start mb-4 pb-4 border-b border-border">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xl shrink-0">
                                        {app.candidate?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="font-bold text-lg text-text-main leading-tight">{app.candidate?.name || 'Ứng viên ẩn danh'}</h3>
                                            {getStatusBadge(app.status)}
                                        </div>
                                        <div className="text-sm font-medium text-text-muted">{app.candidate?.email}</div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1.5 rounded-lg border text-sm font-black flex items-center gap-1.5 ${getScoreColor(app.aiScore)}`}>
                                    AI Score: {app.aiScore ? `${app.aiScore}/100` : 'Đang chấm...'}
                                </div>
                            </div>

                            <div className="space-y-3 mb-6 flex-1">
                                <div className="flex items-center gap-3 text-sm font-medium text-text-muted">
                                    <Calendar size={16} className="text-primary shrink-0" />
                                    <span>Nộp ngày: {new Date(app.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>

                                {app.coverLetter && (
                                    <div className="bg-surface p-3 rounded-xl text-sm text-text-muted font-medium line-clamp-2 italic border border-border">
                                        "{app.coverLetter}"
                                    </div>
                                )}

                                {app.aiSummary && (
                                    <div className="text-sm font-medium text-text-main bg-primary/5 p-4 rounded-xl border border-primary/10">
                                        <span className="font-bold text-primary block mb-1">💡 Phân tích từ AI:</span>
                                        <div className="line-clamp-3 leading-relaxed">{app.aiSummary}</div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-border mt-auto">
                                <a
                                    href={app.cvUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl font-bold text-primary hover:bg-primary-light transition-colors text-sm"
                                >
                                    <ExternalLink size={16} /> Xem CV
                                </a>

                                {/* ✅ FIX 3: Nút duyệt/từ chối đã được nối mạng API */}
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => handleUpdateStatus(app._id, 'shortlisted')}
                                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${app.status === 'shortlisted' ? 'bg-success text-white shadow-md shadow-success/20' : 'bg-success/10 text-success hover:bg-success hover:text-white'}`}
                                        title="Duyệt hồ sơ (Đưa vào vòng trong)"
                                    >
                                        <CheckCircle size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(app._id, 'rejected')}
                                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${app.status === 'rejected' ? 'bg-danger text-white shadow-md shadow-danger/20' : 'bg-danger/10 text-danger hover:bg-danger hover:text-white'}`}
                                        title="Từ chối hồ sơ"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </RecruiterLayout>
    );
}