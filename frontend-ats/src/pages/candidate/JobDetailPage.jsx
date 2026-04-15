import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CandidateLayout } from '@/layout/CandidateLayout';
import { RecruiterLayout } from '@/layout/RecruiterLayout';
import { Button } from '@/ui/Button';
import { MapPin, DollarSign, Clock, Building, ChevronLeft, Send, User, X, UploadCloud, CheckCircle, Loader2, Edit, Users } from 'lucide-react';
import api from '@/api/axios';
import { useAuth } from '@/context/AuthContext';

export function JobDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Kiểm tra xem người đang xem có phải là Nhà tuyển dụng / Admin không
    const isRecruiter = user?.role === 'recruiter' || user?.role === 'admin';

    // Tự động chọn Layout dựa theo Role
    const Layout = isRecruiter ? RecruiterLayout : CandidateLayout;

    // State quản lý dữ liệu Job thật
    const [job, setJob] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);

    // State quản lý form ứng tuyển
    const [showModal, setShowModal] = useState(false);
    const [file, setFile] = useState(null);
    const [coverLetter, setCoverLetter] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    // GỌI API LẤY DỮ LIỆU JOB THẬT THEO ID
    useEffect(() => {
        const fetchJobDetail = async () => {
            try {
                const { data } = await api.get(`/jobs/${id}`);
                setJob(data.data);
            } catch (err) {
                console.error("Lỗi khi tải chi tiết công việc:", err);
            } finally {
                setPageLoading(false);
            }
        };
        fetchJobDetail();
    }, [id]);

    // Format lương USD
    const formatSalary = (min, max) => {
        if (!min && !max) return 'Thỏa thuận';
        if (!min) return `Lên đến $${max}`;
        if (!max) return `Từ $${min}`;
        return `$${min} - $${max}`;
    };

    const handleApply = async (e) => {
        e.preventDefault();
        if (!file) return setError('Vui lòng chọn file CV (Định dạng PDF)');

        // Validate dung lượng file (Max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return setError('Kích thước file CV không được vượt quá 5MB');
        }

        setIsApplying(true);
        setError('');

        const formData = new FormData();
        formData.append('cv', file);
        if (coverLetter) formData.append('coverLetter', coverLetter);

        try {
            await api.post(`/applications/${id}/apply`, formData); // Axios đã được fix tự nhận multipart/form-data
            setSuccess(true);
            setTimeout(() => {
                navigate('/applications'); // Đã chuyển sang trang quản lý đơn theo yêu cầu
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi nộp CV');
        } finally {
            setIsApplying(false);
        }
    };

    if (pageLoading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                    <span className="font-semibold text-text-muted">Đang tải thông tin...</span>
                </div>
            </Layout>
        );
    }

    if (!job) {
        return (
            <Layout>
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold text-text-main mb-2">Không tìm thấy công việc!</h2>
                    <p className="text-text-muted mb-6">Công việc này có thể đã bị xóa hoặc hết hạn.</p>
                    <button onClick={() => navigate(-1)}>
                        <Button>Quay lại</Button>
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-text-muted hover:text-primary font-bold mb-6 transition-colors">
                <ChevronLeft size={20} /> Quay lại
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-0">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-border shadow-sm">
                        <h1 className="text-3xl font-black text-text-main mb-4">{job.title}</h1>
                        <div className="flex flex-wrap items-center gap-6 mb-6">
                            <div className="flex items-center gap-2 text-text-muted font-medium">
                                <Building size={18} className="text-primary" />
                                <span className="text-lg">{job.recruiter?.companyName || 'Công ty ẩn danh'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-text-muted font-medium">
                                <MapPin size={18} className="text-primary" />
                                <span>{job.location}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 py-6 border-y border-border">
                            <div className="flex-1 min-w-[120px]">
                                <div className="text-sm text-text-muted font-semibold mb-1">Mức lương</div>
                                <div className="text-success font-bold flex items-center gap-1">
                                    <DollarSign size={18} />{formatSalary(job.salaryMin, job.salaryMax)}
                                </div>
                            </div>
                            <div className="flex-1 min-w-[120px]">
                                <div className="text-sm text-text-muted font-semibold mb-1">Hình thức</div>
                                <div className="text-text-main font-bold flex items-center gap-1">
                                    <Clock size={18} />{job.type}
                                </div>
                            </div>
                            <div className="flex-1 min-w-[120px]">
                                <div className="text-sm text-text-muted font-semibold mb-1">Cấp bậc</div>
                                <div className="text-text-main font-bold flex items-center gap-1">
                                    <User size={18} />{job.level}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-border shadow-sm space-y-8">
                        <section>
                            <h3 className="text-xl font-extrabold text-text-main mb-4">Mô tả công việc</h3>
                            <div className="text-text-muted leading-relaxed font-medium whitespace-pre-wrap">
                                {job.description}
                            </div>
                        </section>
                        <section>
                            <h3 className="text-xl font-extrabold text-text-main mb-4">Yêu cầu ứng viên</h3>
                            <div className="text-text-muted leading-relaxed font-medium whitespace-pre-wrap">
                                {job.requirements}
                            </div>
                        </section>
                        {job.skills && job.skills.length > 0 && (
                            <section>
                                <h3 className="text-xl font-extrabold text-text-main mb-4">Kỹ năng chuyên môn</h3>
                                <div className="flex flex-wrap gap-2">
                                    {job.skills.map((skill, idx) => (
                                        <span key={idx} className="px-3 py-1.5 bg-surface border border-border rounded-lg text-sm font-bold text-text-muted">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-border shadow-sm sticky top-24">

                        {isRecruiter ? (
                            <>
                                <h3 className="text-lg font-extrabold text-text-main mb-2">Công cụ quản lý</h3>
                                <p className="text-text-muted text-sm font-medium mb-6">Bạn đang xem tin dưới góc nhìn của Nhà tuyển dụng.</p>

                                <Link to={`/recruiter/jobs/${id}/edit`}>
                                    <Button className="w-full py-3.5 text-base rounded-xl mb-3 bg-surface text-text-main hover:bg-border border border-border transition-colors">
                                        <Edit size={18} className="mr-2 inline" /> Chỉnh sửa tin này
                                    </Button>
                                </Link>

                                <Link to={`/recruiter/candidates?jobId=${id}`}>
                                    <Button className="w-full py-3.5 text-base rounded-xl">
                                        <Users size={18} className="mr-2 inline" /> Xem ứng viên ({job.applicantCount || 0})
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-extrabold text-text-main mb-2">Sẵn sàng gia nhập?</h3>
                                <p className="text-text-muted text-sm font-medium mb-6">Gửi CV của bạn ngay hôm nay để không bỏ lỡ cơ hội này.</p>
                                <Button onClick={() => setShowModal(true)} className="w-full py-3.5 text-base rounded-xl">
                                    <Send size={18} className="mr-2 inline" /> Ứng tuyển ngay
                                </Button>
                            </>
                        )}

                        <div className="mt-6 pt-6 border-t border-border">
                            <h4 className="font-bold text-text-main mb-4">Về công ty</h4>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-surface rounded-xl overflow-hidden border border-border flex items-center justify-center shrink-0">
                                    <img
                                        src={job.recruiter?.companyLogo || `https://ui-avatars.com/api/?name=${job.recruiter?.companyName || 'C'}&background=e0f2fe&color=0284c7`}
                                        alt="Logo"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div>
                                    <div className="font-bold text-text-main line-clamp-1">{job.recruiter?.companyName || 'Công ty ẩn danh'}</div>
                                    {job.recruiter?.companyWebsite && (
                                        <a href={job.recruiter.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-medium">
                                            Website công ty
                                        </a>
                                    )}
                                </div>
                            </div>
                            {job.recruiter?.companyDesc && (
                                <p className="text-sm text-text-muted font-medium line-clamp-3">
                                    {job.recruiter.companyDesc}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL NỘP CV */}
            {/* ✅ Đã tối ưu memory: Không render modal vào DOM nếu đang đăng nhập là HR */}
            {!isRecruiter && showModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => !isApplying && setShowModal(false)}
                            className="absolute top-6 right-6 text-text-muted hover:text-text-main hover:bg-surface p-1 rounded-lg transition-colors"
                        >
                            <X size={24} />
                        </button>

                        {success ? (
                            <div className="text-center py-8">
                                <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle size={40} />
                                </div>
                                <h2 className="text-2xl font-black text-text-main mb-2">Nộp CV thành công!</h2>
                                <p className="text-text-muted font-medium">Hệ thống đang chuyển hướng sang trang quản lý đơn...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleApply}>
                                <h2 className="text-2xl font-black text-text-main mb-2">Ứng tuyển vị trí này</h2>
                                <p className="text-text-muted font-medium mb-6 line-clamp-1">{job.title}</p>

                                {error && (
                                    <div className="p-3 mb-6 bg-danger/10 text-danger border border-danger/20 rounded-xl text-sm font-semibold">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-6 mb-8">
                                    <div>
                                        <label className="block text-sm font-bold text-text-main mb-2">CV của bạn (Bắt buộc) <span className="text-danger">*</span></label>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={(e) => setFile(e.target.files[0])}
                                        />
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${file ? 'border-primary bg-primary-light/30' : 'border-border hover:border-primary hover:bg-surface'}`}
                                        >
                                            <UploadCloud className={`mx-auto mb-3 ${file ? 'text-primary' : 'text-text-muted'}`} size={32} />
                                            {file ? (
                                                <div className="font-bold text-primary truncate px-4">{file.name}</div>
                                            ) : (
                                                <>
                                                    <div className="font-bold text-text-main mb-1">Click để tải lên CV của bạn</div>
                                                    <div className="text-sm text-text-muted">Chỉ hỗ trợ định dạng PDF (Max 5MB)</div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-text-main mb-2">Thư giới thiệu (Không bắt buộc)</label>
                                        <textarea
                                            className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-y min-h-[100px] text-sm font-medium placeholder:text-text-muted"
                                            placeholder="Ghi chú thêm về kinh nghiệm hoặc lý do bạn phù hợp với công việc này..."
                                            value={coverLetter}
                                            onChange={(e) => setCoverLetter(e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full py-3 text-base" isLoading={isApplying}>
                                    Hoàn tất nộp đơn
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </Layout>
    );
}