import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { RecruiterLayout } from '@/layout/RecruiterLayout';
import { Input } from '@/ui/Input';
import { Textarea } from '@/ui/Textarea';
import { Button } from '@/ui/Button';
import api from '@/api/axios';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

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

    // Spinner khi đang tải dữ liệu cũ (chỉ ở Edit mode)
    if (pageLoading) {
        return (
            <RecruiterLayout>
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm font-medium text-text-muted">Đang tải thông tin...</span>
                </div>
            </RecruiterLayout>
        );
    }

    return (
        <RecruiterLayout>
            <div className="mb-6">
                <Link to="/recruiter/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-primary transition-colors mb-4">
                    <ArrowLeft size={16} /> Quay lại danh sách
                </Link>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main">
                    {isEditMode ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng tin tuyển dụng mới'}
                </h1>
                <p className="text-text-muted mt-1 font-medium">
                    {isEditMode
                        ? 'Cập nhật thông tin bên dưới và lưu lại.'
                        : 'Điền đầy đủ thông tin bên dưới để thu hút ứng viên tiềm năng.'}
                </p>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-2 p-4 bg-danger/10 border border-danger/20 text-danger rounded-xl text-sm font-medium">
                    <AlertCircle size={18} /><span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-sm space-y-8">

                {/* Thông tin cơ bản */}
                <div className="space-y-6">
                    <h3 className="text-lg font-extrabold text-text-main border-b border-border pb-2">1. Thông tin cơ bản</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input name="title" label="Tiêu đề công việc" placeholder="VD: Senior Frontend Developer" value={form.title} onChange={handleChange} required />
                        <Input name="location" label="Địa điểm làm việc" placeholder="VD: Hà Nội, Remote..." value={form.location} onChange={handleChange} required />

                        <div className="flex flex-col gap-1.5 w-full">
                            <label className="text-sm font-semibold text-text-main">Cấp bậc</label>
                            <select name="level" value={form.level} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm">
                                <option value="intern">Intern / Thực tập sinh</option>
                                <option value="fresher">Fresher</option>
                                <option value="junior">Junior</option>
                                <option value="mid">Mid-level</option>
                                <option value="senior">Senior</option>
                                <option value="lead">Lead / Manager</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5 w-full">
                            <label className="text-sm font-semibold text-text-main">Hình thức làm việc</label>
                            <select name="type" value={form.type} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm">
                                <option value="full-time">Full-time (Toàn thời gian)</option>
                                <option value="part-time">Part-time (Bán thời gian)</option>
                                <option value="remote">Remote (Từ xa)</option>
                                <option value="contract">Contract (Hợp đồng)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Lương & Thời hạn */}
                <div className="space-y-6">
                    <h3 className="text-lg font-extrabold text-text-main border-b border-border pb-2">2. Phúc lợi & Thời hạn</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input name="salaryMin" label="Lương tối thiểu ($)" type="number" placeholder="VD: 1000" value={form.salaryMin} onChange={handleChange} />
                        <Input name="salaryMax" label="Lương tối đa ($)" type="number" placeholder="VD: 2000" value={form.salaryMax} onChange={handleChange} />
                        <Input name="deadline" label="Hạn nộp hồ sơ" type="date" value={form.deadline} onChange={handleChange} />
                    </div>
                </div>

                {/* Mô tả chi tiết */}
                <div className="space-y-6">
                    <h3 className="text-lg font-extrabold text-text-main border-b border-border pb-2">3. Mô tả chi tiết</h3>
                    <Input
                        name="skills"
                        label="Kỹ năng yêu cầu (Cách nhau bằng dấu phẩy)"
                        placeholder="VD: React, Node.js, TypeScript"
                        value={form.skills}
                        onChange={handleChange}
                        required
                    />
                    <Textarea
                        name="description"
                        label="Mô tả công việc (JD)"
                        placeholder="Mô tả công việc ứng viên cần làm..."
                        value={form.description}
                        onChange={handleChange}
                        required
                    />
                    <Textarea
                        name="requirements"
                        label="Yêu cầu ứng viên"
                        placeholder="Các yêu cầu về kinh nghiệm, bằng cấp..."
                        value={form.requirements}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-4">
                    <Link to="/recruiter/jobs">
                        <Button variant="outline" type="button">Hủy bỏ</Button>
                    </Link>
                    <Button type="submit" isLoading={loading}>
                        {isEditMode ? 'Lưu thay đổi' : 'Đăng tin ngay'}
                    </Button>
                </div>

            </form>
        </RecruiterLayout>
    );
}