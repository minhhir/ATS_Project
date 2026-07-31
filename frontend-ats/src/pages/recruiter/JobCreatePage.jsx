import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { RecruiterLayout } from '@/layout/RecruiterLayout';
import { Input } from '@/ui/Input';
import { Textarea } from '@/ui/Textarea';
import { Button } from '@/ui/Button';
import { Skeleton, SkeletonText } from '@/ui/Skeleton';
import api from '@/api/axios';
import { ArrowLeft, AlertCircle } from 'lucide-react';

// Class dùng chung cho <select> để khớp đúng chiều cao và bo góc của component Input.
const selectClasses =
    'form-select w-full h-11 pl-3 pr-9 rounded-sm border border-border bg-white text-sm text-text-main ' +
    'cursor-pointer transition-colors duration-200 ease-smooth hover:border-border-strong ' +
    'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25';

// Vấn đề: Tạo và sửa tin gần như giống hệt nhau (cùng form, cùng layout) — viết 2 page riêng sẽ trùng 90% code; URL /create không có id, /:id/edit có id.
// Giải pháp: Một component dùng useParams để detect mode (isEditMode), prefill khi edit và route đúng API endpoint khi submit.
export function JobCreatePage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(isEditMode);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        title: '', location: '', level: 'junior', type: 'full-time',
        salaryMin: '', salaryMax: '', deadline: '',
        description: '', requirements: '', skills: ''
    });

    // Kéo dữ liệu cũ về khi ở chế độ Edit
    useEffect(() => {
        if (!isEditMode) return;

        const fetchOldJobData = async () => {
            try {
                const { data } = await api.get(`/jobs/${id}`);
                const job = data.data;

                // Vấn đề: BE trả skills dạng array nhưng input UI là chuỗi CSV — gán thẳng sẽ lỗi React render.
                // Giải pháp: join ', ' khi load, sẽ split lại thành array khi submit.
                const skillsString = Array.isArray(job.skills)
                    ? job.skills.join(', ')
                    : (job.skills || '');

                // Vấn đề: input type="date" chỉ chấp nhận format 'YYYY-MM-DD', BE trả ISO string với giờ.
                // Giải pháp: slice(0, 10) lấy đúng phần ngày, tránh date input bị reject value và để trống.
                const deadlineFormatted = job.deadline
                    ? new Date(job.deadline).toISOString().slice(0, 10)
                    : '';

                setForm({
                    title: job.title || '',
                    location: job.location || '',
                    level: job.level || 'junior',
                    type: job.type || 'full-time',
                    salaryMin: job.salaryMin ?? '',
                    salaryMax: job.salaryMax ?? '',
                    deadline: deadlineFormatted,
                    description: job.description || '',
                    requirements: job.requirements || '',
                    skills: skillsString,
                });
            } catch {
                setError('Không tìm thấy tin tuyển dụng này.');
                setTimeout(() => navigate('/recruiter/jobs'), 2000);
            } finally {
                setPageLoading(false);
            }
        };

        fetchOldJobData();
    }, [id, isEditMode, navigate]);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Vấn đề: Form lưu salary dạng string, BE schema là Number; skills là CSV string nhưng schema là array; gửi salary='' sẽ thành 0 không phải "không khai báo".
    // Giải pháp: Number(...) || undefined để trống thật sự là undefined; split skills bằng dấu phẩy, trim từng item, filter rỗng.
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                ...form,
                salaryMin: Number(form.salaryMin) || undefined,
                salaryMax: Number(form.salaryMax) || undefined,
                skills: form.skills.split(',').map(s => s.trim()).filter(s => s),
            };

            if (isEditMode) {
                await api.put(`/jobs/${id}`, payload);
            } else {
                await api.post('/jobs', payload);
            }

            navigate('/recruiter/jobs');
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // Skeleton khi đang tải dữ liệu cũ (chỉ ở Edit mode) — dựng đúng khung form sắp hiện
    if (pageLoading) {
        return (
            <RecruiterLayout>
                <div className="max-w-3xl space-y-4" aria-busy="true" aria-label="Đang tải tin tuyển dụng">
                    <Skeleton className="h-7 w-64" />
                    <div className="border border-border rounded-lg p-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Skeleton className="h-11" />
                            <Skeleton className="h-11" />
                            <Skeleton className="h-11" />
                            <Skeleton className="h-11" />
                        </div>
                        <SkeletonText lines={4} />
                    </div>
                </div>
            </RecruiterLayout>
        );
    }

    return (
        <RecruiterLayout>
            {/* Form nhập liệu dài nên giới hạn bề rộng: dòng input quá rộng làm mắt phải quét
                cả màn hình mới nối được nhãn với ô nhập tương ứng. */}
            <div className="max-w-3xl space-y-6">
                <div>
                    <Link
                        to="/recruiter/jobs"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-main transition-colors rounded-sm"
                    >
                        <ArrowLeft size={15} aria-hidden="true" /> Quay lại danh sách
                    </Link>
                    <h1 className="text-2xl font-semibold text-text-main mt-3">
                        {isEditMode ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng tin tuyển dụng'}
                    </h1>
                    <p className="text-sm text-text-muted mt-1">
                        {isEditMode
                            ? 'Thay đổi sẽ áp dụng ngay với ứng viên đang xem tin này.'
                            : 'Tin sẽ hiển thị với ứng viên ngay sau khi đăng.'}
                    </p>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="flex items-start gap-2.5 p-3 rounded-sm border border-danger-100 bg-danger-50 text-sm text-danger-700"
                    >
                        <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Ba khối <fieldset> thay cho ba <h3>: nhóm trường có <legend> đúng ngữ nghĩa
                        nên screen reader đọc được "bạn đang ở nhóm Thông tin cơ bản". */}
                    <fieldset className="border border-border rounded-lg bg-surface-raised">
                        <legend className="sr-only">Thông tin cơ bản</legend>
                        <div className="px-5 py-3 border-b border-border-subtle">
                            <h2 className="text-sm font-semibold text-text-main">Thông tin cơ bản</h2>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input name="title" label="Tiêu đề công việc" placeholder="Senior Frontend Developer" value={form.title} onChange={handleChange} required />
                            <Input name="location" label="Địa điểm làm việc" placeholder="Hà Nội, Remote…" value={form.location} onChange={handleChange} required />

                            <div className="flex flex-col gap-1.5 w-full">
                                <label htmlFor="job-level" className="text-sm font-semibold text-text-main">Cấp bậc</label>
                                <select id="job-level" name="level" value={form.level} onChange={handleChange} className={selectClasses}>
                                    <option value="intern">Intern / Thực tập sinh</option>
                                    <option value="fresher">Fresher</option>
                                    <option value="junior">Junior</option>
                                    <option value="mid">Mid-level</option>
                                    <option value="senior">Senior</option>
                                    <option value="lead">Lead / Manager</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5 w-full">
                                <label htmlFor="job-type" className="text-sm font-semibold text-text-main">Hình thức làm việc</label>
                                <select id="job-type" name="type" value={form.type} onChange={handleChange} className={selectClasses}>
                                    <option value="full-time">Full-time (Toàn thời gian)</option>
                                    <option value="part-time">Part-time (Bán thời gian)</option>
                                    <option value="remote">Remote (Từ xa)</option>
                                    <option value="contract">Contract (Hợp đồng)</option>
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="border border-border rounded-lg bg-surface-raised">
                        <legend className="sr-only">Lương và thời hạn</legend>
                        <div className="px-5 py-3 border-b border-border-subtle">
                            <h2 className="text-sm font-semibold text-text-main">Lương & thời hạn</h2>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input name="salaryMin" label="Lương tối thiểu ($)" type="number" placeholder="1000" value={form.salaryMin} onChange={handleChange} />
                            <Input name="salaryMax" label="Lương tối đa ($)" type="number" placeholder="2000" value={form.salaryMax} onChange={handleChange} />
                            <Input name="deadline" label="Hạn nộp hồ sơ" type="date" value={form.deadline} onChange={handleChange} />
                        </div>
                    </fieldset>

                    <fieldset className="border border-border rounded-lg bg-surface-raised">
                        <legend className="sr-only">Mô tả chi tiết</legend>
                        <div className="px-5 py-3 border-b border-border-subtle">
                            <h2 className="text-sm font-semibold text-text-main">Mô tả chi tiết</h2>
                        </div>
                        <div className="p-5 space-y-4">
                            <Input
                                name="skills"
                                label="Kỹ năng yêu cầu"
                                placeholder="React, Node.js, TypeScript"
                                hint="Ngăn cách bằng dấu phẩy. Hệ thống dùng danh sách này để chấm độ khớp CV của ứng viên."
                                value={form.skills}
                                onChange={handleChange}
                                required
                            />
                            <Textarea
                                name="description"
                                label="Mô tả công việc"
                                placeholder="Công việc hằng ngày, đội ngũ, sản phẩm ứng viên sẽ tham gia…"
                                value={form.description}
                                onChange={handleChange}
                                required
                            />
                            <Textarea
                                name="requirements"
                                label="Yêu cầu ứng viên"
                                placeholder="Số năm kinh nghiệm, công nghệ bắt buộc, bằng cấp nếu có…"
                                value={form.requirements}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </fieldset>

                    <div className="flex justify-end gap-3">
                        <Link
                            to="/recruiter/jobs"
                            className="inline-flex items-center justify-center h-11 px-4 rounded-lg border border-border bg-white text-sm font-semibold text-text-main transition-colors hover:bg-surface hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                        >
                            Hủy bỏ
                        </Link>
                        <Button type="submit" isLoading={loading}>
                            {isEditMode ? 'Lưu thay đổi' : 'Đăng tin'}
                        </Button>
                    </div>
                </form>
            </div>
        </RecruiterLayout>
    );
}
