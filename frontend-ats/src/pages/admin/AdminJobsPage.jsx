import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layout/AdminLayout';
import { ConfirmDialog } from '@/ui/ConfirmDialog';
import { Skeleton } from '@/ui/Skeleton';
import { Trash2, Flame } from 'lucide-react';
import api from '@/api/axios';

export function AdminJobsPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pendingDelete, setPendingDelete] = useState(null);

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
    // Vấn đề: Tin tuyển dụng pending phải có cả 2 nút "Duyệt" và "Từ chối"; sau khi approve thì status badge phải đổi ngay không bắt admin F5.
    // Giải pháp: 1 hàm handleApprove nhận status param ('approved'|'rejected'), optimistic update isApproved trong state.
    const handleApproveJob = async (id, status) => {
        try {
            await api.patch(`/admin/jobs/${id}/approve`, { status });
            setJobs(jobs.map(j => j._id === id ? { ...j, isApproved: status } : j));
            alert(`Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} tin!`);
        } catch {
            alert('Lỗi khi phê duyệt!');
        }
    };

    // Vấn đề: Xoá tin sẽ kéo theo xoá hết application của tin đó, tác động đến nhiều ứng viên — phải có warning rõ.
    // Giải pháp: Confirm message nói rõ hậu quả; optimistic remove khỏi list sau API success.
    // Phần optimistic giữ nguyên; chỉ đổi cơ chế hỏi sang ConfirmDialog để focus mặc định vào Hủy.
    const handleDeleteJob = async (id) => {
        try {
            await api.delete(`/admin/jobs/${id}`);
            setJobs(jobs.filter(j => j._id !== id));
            alert('Đã xóa tin tuyển dụng!');
        } catch {
            alert('Lỗi khi xóa!');
        }
    };

    // Vấn đề: Đánh dấu HOT là tính năng đặc quyền admin (đẩy tin lên đầu); FE phải gọi đúng endpoint /jobs/:id/feature thay vì admin endpoint.
    // Giải pháp: Toggle thông qua API /jobs/:id/feature (đã được middleware isAdmin bảo vệ), update isFeatured trong state.
    const handleToggleHot = async (id) => {
        try {
            const { data } = await api.patch(`/jobs/${id}/feature`);
            setJobs(jobs.map(j => j._id === id ? { ...j, isFeatured: data.isFeatured } : j));
        } catch (error) {
            alert(error.response?.data?.message || 'Không thể cập nhật trạng thái HOT');
        }
    };

    const StatusCell = ({ job }) => {
        if (job.isApproved === 'pending') {
            return (
                <div className="flex gap-1.5">
                    <button
                        type="button"
                        onClick={() => handleApproveJob(job._id, 'approved')}
                        aria-label={`Duyệt tin ${job.title}`}
                        className="inline-flex items-center h-7 px-2 rounded-sm border border-border bg-white text-xs font-semibold text-text-main transition-colors cursor-pointer hover:bg-success-50 hover:border-success-100 hover:text-success-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                        Duyệt
                    </button>
                    <button
                        type="button"
                        onClick={() => handleApproveJob(job._id, 'rejected')}
                        aria-label={`Từ chối tin ${job.title}`}
                        className="inline-flex items-center h-7 px-2 rounded-sm border border-border bg-white text-xs font-semibold text-text-main transition-colors cursor-pointer hover:bg-danger-50 hover:border-danger-100 hover:text-danger-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                        Từ chối
                    </button>
                </div>
            );
        }
        const approved = job.isApproved === 'approved';
        return (
            <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm border text-xs font-medium ${
                approved
                    ? 'border-success-100 bg-success-50 text-success-700'
                    : 'border-danger-100 bg-danger-50 text-danger-700'
            }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${approved ? 'bg-success' : 'bg-danger'}`} aria-hidden="true" />
                {approved ? 'Đã duyệt' : 'Bị từ chối'}
            </span>
        );
    };

    return (
        <AdminLayout>
            <div>
                <h1 className="text-2xl font-semibold text-text-main">Tin tuyển dụng</h1>
                <p className="text-sm text-text-muted mt-1">
                    Duyệt tin trước khi ứng viên nhìn thấy, và gỡ tin vi phạm.
                </p>
            </div>

            <div className="border border-border rounded-lg bg-surface-raised overflow-hidden">
                {loading ? (
                    <div className="p-4 space-y-3" aria-busy="true" aria-label="Đang tải danh sách tin tuyển dụng">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between gap-4">
                                <Skeleton className="h-4 w-64" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        ))}
                    </div>
                ) : jobs.length === 0 ? (
                    <p className="p-10 text-sm text-text-muted">
                        Chưa có nhà tuyển dụng nào đăng tin lên hệ thống.
                    </p>
                ) : (
                    <>
                        <div className="hidden md:block scroll-x">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-surface-sunken text-text-muted border-b border-border">
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs">Tin tuyển dụng</th>
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs">Nhà tuyển dụng</th>
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs">Trạng thái duyệt</th>
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {jobs.map((job) => (
                                        <tr key={job._id} className="hover:bg-surface transition-colors">
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-text-main">{job.title}</span>
                                                    {job.isFeatured && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm border border-border text-[11px] font-medium text-text-muted">
                                                            Nổi bật
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Trường job.salary không phải lúc nào cũng có (schema dùng salaryMin/salaryMax),
                                                    nên chỉ hiện khi thật sự có giá trị thay vì in ra "Lương: " trống. */}
                                                {job.salary && (
                                                    <div className="text-xs text-text-subtle mt-0.5">Lương: {job.salary}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="text-text-main">{job.recruiter?.companyName || 'Không rõ'}</div>
                                                <div className="text-xs text-text-subtle">{job.recruiter?.email}</div>
                                            </td>
                                            <td className="px-4 py-2.5"><StatusCell job={job} /></td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleHot(job._id)}
                                                        aria-pressed={Boolean(job.isFeatured)}
                                                        aria-label={job.isFeatured ? `Bỏ đánh dấu nổi bật cho tin ${job.title}` : `Đánh dấu nổi bật cho tin ${job.title}`}
                                                        className={`inline-flex items-center justify-center w-8 h-8 rounded-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                                                            job.isFeatured ? 'text-warning-700 bg-warning-50' : 'text-text-muted hover:bg-surface-sunken hover:text-text-main'
                                                        }`}
                                                    >
                                                        <Flame size={16} className={job.isFeatured ? 'fill-current' : ''} aria-hidden="true" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPendingDelete(job)}
                                                        aria-label={`Xóa tin ${job.title}`}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-sm text-text-muted transition-colors cursor-pointer hover:bg-danger-50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                                    >
                                                        <Trash2 size={16} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <ul className="md:hidden divide-y divide-border-subtle">
                            {jobs.map((job) => (
                                <li key={job._id} className="px-4 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="font-medium text-sm text-text-main">{job.title}</div>
                                            <div className="text-xs text-text-muted mt-0.5">{job.recruiter?.companyName || 'Không rõ'}</div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleHot(job._id)}
                                                aria-pressed={Boolean(job.isFeatured)}
                                                aria-label={job.isFeatured ? `Bỏ đánh dấu nổi bật cho tin ${job.title}` : `Đánh dấu nổi bật cho tin ${job.title}`}
                                                className={`inline-flex items-center justify-center w-9 h-9 rounded-sm border border-border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                                                    job.isFeatured ? 'text-warning-700 bg-warning-50' : 'text-text-muted'
                                                }`}
                                            >
                                                <Flame size={16} className={job.isFeatured ? 'fill-current' : ''} aria-hidden="true" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPendingDelete(job)}
                                                aria-label={`Xóa tin ${job.title}`}
                                                className="inline-flex items-center justify-center w-9 h-9 rounded-sm border border-border text-text-muted cursor-pointer hover:bg-danger-50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                            >
                                                <Trash2 size={16} aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-2"><StatusCell job={job} /></div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>

            <ConfirmDialog
                open={Boolean(pendingDelete)}
                title="Xóa tin tuyển dụng"
                message={pendingDelete
                    ? `Xóa "${pendingDelete.title}" sẽ xóa luôn toàn bộ đơn ứng tuyển đã nộp cho tin này. Ứng viên sẽ mất lịch sử nộp đơn và không khôi phục được.`
                    : ''}
                confirmLabel="Xóa tin"
                onCancel={() => setPendingDelete(null)}
                onConfirm={() => {
                    const target = pendingDelete;
                    setPendingDelete(null);
                    if (target) handleDeleteJob(target._id);
                }}
            />
        </AdminLayout>
    );
}
