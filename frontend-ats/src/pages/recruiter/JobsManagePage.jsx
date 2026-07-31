import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RecruiterLayout } from '@/layout/RecruiterLayout';
import { Skeleton } from '@/ui/Skeleton';
import api from '@/api/axios';
import { Plus, Edit, Trash2 } from 'lucide-react';

export function JobsManagePage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyJobs();
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

    // Vấn đề: Xoá tin là thao tác mất data; nếu không confirm dễ click nhầm; sau khi xoá phải refetch toàn bộ list sẽ rất chậm.
    // Giải pháp: window.confirm hỏi trước, optimistic remove khỏi state local sau khi API success để UI cập nhật ngay không cần refetch.
    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn ẩn/xóa tin này?')) return;
        try {
            await api.delete(`/jobs/${id}`);
            setJobs(jobs.filter(job => job._id !== id));
        } catch (error) {
            alert(error.response?.data?.message || 'Xóa thất bại');
        }
    };

    const formatDeadline = (deadline) =>
        deadline ? new Date(deadline).toLocaleDateString('vi-VN') : 'Không đặt hạn';

    return (
        <RecruiterLayout>
            <div className="flex flex-wrap justify-between items-start gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-text-main">Tin tuyển dụng</h1>
                    <p className="text-sm text-text-muted mt-1">
                        Các vị trí bạn đang mở và số hồ sơ mỗi tin đã nhận.
                    </p>
                </div>
                <Link
                    to="/recruiter/jobs/create"
                    className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 shrink-0"
                >
                    <Plus size={16} aria-hidden="true" /> Đăng tin mới
                </Link>
            </div>

            <div className="border border-border rounded-lg bg-surface-raised overflow-hidden">
                {loading ? (
                    <div className="p-4 space-y-3" aria-busy="true" aria-label="Đang tải danh sách tin tuyển dụng">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between gap-4">
                                <Skeleton className="h-4 w-56" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        ))}
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="p-10 max-w-xl">
                        <h2 className="text-base font-semibold text-text-main">Bạn chưa đăng tin nào</h2>
                        <p className="text-sm text-text-muted mt-2">
                            Ứng viên chỉ tìm thấy bạn khi có tin đang mở. Tin đầu tiên cần tối thiểu tiêu đề,
                            địa điểm, mô tả công việc và yêu cầu ứng viên.
                        </p>
                        <Link
                            to="/recruiter/jobs/create"
                            className="inline-flex items-center justify-center gap-2 h-11 px-4 mt-5 rounded-lg bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                        >
                            <Plus size={16} aria-hidden="true" /> Đăng tin đầu tiên
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Bảng mật độ cao cho desktop: hàng 40px, chữ 14px — HR ngồi cả buổi với màn này,
                            mỗi hàng tiết kiệm được là thêm một tin thấy mà không phải cuộn. */}
                        <div className="hidden md:block scroll-x">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-surface-sunken text-text-muted">
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs">Vị trí</th>
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs">Cấp bậc</th>
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs text-right">Hồ sơ</th>
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs">Hạn nộp</th>
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {jobs.map((job) => (
                                        <tr key={job._id} className="hover:bg-surface transition-colors">
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        to={`/jobs/${job._id}`}
                                                        className="font-medium text-text-main hover:text-primary hover:underline rounded-sm"
                                                    >
                                                        {job.title}
                                                    </Link>
                                                    {job.isFeatured && (
                                                        <span
                                                            className="inline-flex items-center px-1.5 py-0.5 rounded-sm border border-warning-100 bg-warning-50 text-[11px] font-medium text-warning-700"
                                                            title="Tin được quản trị viên đánh dấu nổi bật"
                                                        >
                                                            Nổi bật
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-text-subtle mt-0.5">{job.location} · {job.type}</div>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm border border-border text-xs text-text-muted capitalize">
                                                    {job.level}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-medium text-text-main tabular-nums">
                                                {job.applicantCount}
                                            </td>
                                            <td className="px-4 py-2.5 text-text-muted tabular-nums">
                                                {formatDeadline(job.deadline)}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        to={`/recruiter/jobs/${job._id}/edit`}
                                                        aria-label={`Sửa tin ${job.title}`}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-sm text-text-muted transition-colors hover:bg-surface-sunken hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                                    >
                                                        <Edit size={16} aria-hidden="true" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(job._id)}
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

                        {/* Dưới md: 5 cột không thể đọc được trên màn 375px nên đổi sang thẻ dọc */}
                        <ul className="md:hidden divide-y divide-border-subtle">
                            {jobs.map((job) => (
                                <li key={job._id} className="px-4 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <Link
                                                to={`/jobs/${job._id}`}
                                                className="font-medium text-sm text-text-main hover:text-primary rounded-sm"
                                            >
                                                {job.title}
                                            </Link>
                                            <div className="text-xs text-text-subtle mt-0.5">{job.location} · {job.type}</div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Link
                                                to={`/recruiter/jobs/${job._id}/edit`}
                                                aria-label={`Sửa tin ${job.title}`}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-sm text-text-muted hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                            >
                                                <Edit size={16} aria-hidden="true" />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(job._id)}
                                                aria-label={`Xóa tin ${job.title}`}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-sm text-text-muted cursor-pointer hover:bg-danger-50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                            >
                                                <Trash2 size={16} aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>

                                    <dl className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                                        <div className="flex gap-1">
                                            <dt className="text-text-subtle">Cấp bậc:</dt>
                                            <dd className="text-text-muted capitalize">{job.level}</dd>
                                        </div>
                                        <div className="flex gap-1">
                                            <dt className="text-text-subtle">Hồ sơ:</dt>
                                            <dd className="text-text-main font-medium tabular-nums">{job.applicantCount}</dd>
                                        </div>
                                        <div className="flex gap-1">
                                            <dt className="text-text-subtle">Hạn:</dt>
                                            <dd className="text-text-muted tabular-nums">{formatDeadline(job.deadline)}</dd>
                                        </div>
                                    </dl>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </RecruiterLayout>
    );
}
