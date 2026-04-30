import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layout/AdminLayout';
import { Trash2, Eye, Briefcase } from 'lucide-react';
import api from '@/api/axios';

export function AdminJobsPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    // GỌI API THẬT
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const { data } = await api.get('/admin/jobs');
                setJobs(data.data);
            } catch (error) {
                console.error('Lỗi tải tin tuyển dụng:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);
    const handleApproveJob = async (id, status) => {
        try {
            await api.patch(`/admin/jobs/${id}/approve`, { status });
            setJobs(jobs.map(j => j._id === id ? { ...j, isApproved: status } : j));
            alert(`Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} tin!`);
        } catch {
            alert('Lỗi khi phê duyệt!');
        }
    };
    const handleDeleteJob = async (id) => {
        if (!window.confirm('Hành động này sẽ xóa tin tuyển dụng và toàn bộ đơn ứng tuyển của tin này. Tiếp tục?')) return;
        try {
            await api.delete(`/admin/jobs/${id}`);
            setJobs(jobs.filter(j => j._id !== id));
            alert('Đã xóa tin tuyển dụng!');
        } catch {
            alert('Lỗi khi xóa!');
        }
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-black text-text-main">Quản lý Việc làm</h1>
                <p className="text-text-muted mt-1 font-medium">Giám sát các tin tuyển dụng được đăng bởi HR.</p>
            </div>

            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface text-text-muted text-sm uppercase tracking-wider">
                                <th className="p-5 font-bold">Tiêu đề công việc</th>
                                <th className="p-5 font-bold">Công ty (HR)</th>
                                <th className="p-5 font-bold">Trạng thái</th>
                                <th className="p-5 font-bold text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan="4" className="p-10 text-center font-bold text-text-muted">Đang tải dữ liệu...</td></tr>
                            ) : jobs.length === 0 ? (
                                <tr><td colSpan="4" className="p-10 text-center font-bold text-text-muted">Chưa có tin tuyển dụng nào.</td></tr>
                            ) : jobs.map((job) => (
                                <tr key={job._id} className="hover:bg-surface/50 transition-colors">
                                    <td className="p-5">
                                        <div className="font-bold text-text-main text-base">{job.title}</div>
                                        <div className="text-xs font-bold text-text-muted mt-1 flex items-center gap-1">
                                            <Briefcase size={12} /> Lương: {job.salary}
                                        </div>
                                    </td>
                                    <td className="p-5 text-sm font-bold text-text-main">
                                        {job.recruiter?.companyName || 'N/A'}
                                        <div className="font-medium text-text-muted text-xs font-normal">{job.recruiter?.email}</div>
                                    </td>
                                    <td className="p-5">
                                        {job.isApproved === 'pending' ? (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleApproveJob(job._id, 'approved')} className="px-3 py-1 bg-success text-white text-xs font-bold rounded-lg">Duyệt</button>
                                                <button onClick={() => handleApproveJob(job._id, 'rejected')} className="px-3 py-1 bg-danger text-white text-xs font-bold rounded-lg">Từ chối</button>
                                            </div>
                                        ) : (
                                            <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${job.isApproved === 'approved' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                                {job.isApproved === 'approved' ? 'Đã duyệt' : 'Bị từ chối'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-5 text-right flex items-center justify-end gap-2">
                                        <button onClick={() => handleDeleteJob(job._id)} className="p-2.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-colors" title="Xóa tin">
                                            <Trash2 size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}