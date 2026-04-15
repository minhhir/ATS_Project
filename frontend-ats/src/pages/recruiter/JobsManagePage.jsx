import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RecruiterLayout } from '@/layout/RecruiterLayout';
import { Button } from '@/ui/Button';
import api from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { Plus, Edit, Trash2, Star, Loader2, Briefcase } from 'lucide-react';

export function JobsManagePage() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyJobs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchMyJobs = async () => {
        try {
            const { data } = await api.get('/jobs/my-jobs');
            setJobs(data.data);
        } catch (error) {
            console.error('Lỗi khi tải danh sách:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn ẩn/xóa tin này?')) return;
        try {
            await api.delete(`/jobs/${id}`);
            setJobs(jobs.filter(job => job._id !== id));
        } catch (error) {
            alert(error.response?.data?.message || 'Xóa thất bại');
        }
    };

    const handleToggleFeature = async (id) => {
        try {
            const { data } = await api.patch(`/jobs/${id}/feature`);
            setJobs(jobs.map(job => job._id === id ? { ...job, isFeatured: data.isFeatured } : job));
        } catch (error) {
            alert('Không thể cập nhật trạng thái nổi bật');
        }
    };

    return (
        <RecruiterLayout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main">Quản lý tin tuyển dụng</h1>
                    <p className="text-text-muted mt-1 font-medium">Danh sách các vị trí bạn đang mở tuyển.</p>
                </div>
                <Link to="/recruiter/jobs/create">
                    <Button className="shrink-0 shadow-sm">
                        <Plus size={18} /> Đăng tin mới
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 text-primary">
                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                        <p className="font-medium">Đang tải dữ liệu...</p>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 text-center">
                        <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
                            <Briefcase className="w-8 h-8 text-text-muted" />
                        </div>
                        <h3 className="text-xl font-bold text-text-main mb-2">Chưa có tin tuyển dụng nào</h3>
                        <p className="text-text-muted mb-6">Bạn chưa đăng bất kỳ vị trí nào lên hệ thống.</p>
                        <Link to="/recruiter/jobs/create">
                            <Button>Bắt đầu đăng tin</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface text-text-muted text-sm uppercase tracking-wider">
                                    <th className="p-4 font-bold border-b border-border">Vị trí tuyển dụng</th>
                                    <th className="p-4 font-bold border-b border-border">Cấp bậc</th>
                                    <th className="p-4 font-bold border-b border-border text-center">Hồ sơ</th>
                                    <th className="p-4 font-bold border-b border-border text-center">Hạn nộp</th>
                                    <th className="p-4 font-bold border-b border-border text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {jobs.map((job) => (
                                    <tr key={job._id} className="hover:bg-surface/50 transition-colors group">
                                        <td className="p-4">
                                            <Link
                                                to={`/jobs/${job._id}`}
                                                className="font-bold text-lg text-text-main hover:text-primary hover:underline transition-colors block mb-1"
                                            >
                                                {job.title}
                                            </Link>
                                            <div className="text-sm text-text-muted">{job.location} • {job.type}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2.5 py-1 bg-surface border border-border text-xs font-bold rounded-md capitalize">
                                                {job.level}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center font-bold text-primary">
                                            {job.applicantCount}
                                        </td>
                                        <td className="p-4 text-center text-sm text-text-muted font-medium">
                                            {job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Không có'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleFeature(job._id)}
                                                    className={`p-2 rounded-lg transition-colors ${job.isFeatured ? 'bg-amber-100 text-amber-500' : 'bg-surface text-text-muted hover:text-amber-500'}`}
                                                    title="Đánh dấu nổi bật"
                                                >
                                                    <Star size={18} className={job.isFeatured ? 'fill-current' : ''} />
                                                </button>
                                                <Link to={`/recruiter/jobs/${job._id}/edit`} className="p-2 bg-surface text-text-muted hover:text-primary hover:bg-primary-light/50 rounded-lg transition-colors inline-flex" title="Sửa tin">
                                                    <Edit size={18} />
                                                </Link>
                                                <button onClick={() => handleDelete(job._id)} className="p-2 bg-surface text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors" title="Xóa tin">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </RecruiterLayout>
    );
}