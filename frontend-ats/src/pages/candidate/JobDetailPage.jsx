import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CandidateLayout } from '@/layout/CandidateLayout';
import { RecruiterLayout } from '@/layout/RecruiterLayout';
import { Button } from '@/ui/Button';
import { Textarea } from '@/ui/Textarea';
import { Skeleton, SkeletonText } from '@/ui/Skeleton';
import { MapPin, ChevronLeft, Send, X, UploadCloud, CheckCircle2, AlertCircle, Edit, Users } from 'lucide-react';
import api from '@/api/axios';
import { useAuth } from '@/context/AuthContext';

// Link mang bộ class của nút, dùng thay cho <Link><Button/></Link> — lồng <button> trong <a>
// là HTML không hợp lệ và screen reader đọc ra hai phần tử tương tác chồng nhau.
const linkButtonBase =
    'inline-flex items-center justify-center gap-2 w-full h-11 px-4 rounded-lg text-sm font-semibold ' +
    'transition-colors duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-primary/40 focus-visible:ring-offset-2';
const linkButtonPrimary = `${linkButtonBase} bg-primary text-white hover:bg-primary-hover`;
const linkButtonOutline = `${linkButtonBase} border border-border bg-white text-text-main hover:bg-surface hover:border-border-strong`;

export function JobDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Vấn đề: Trang chi tiết job dùng chung cho cả candidate (apply) và HR/admin (xem/sửa); 2 nhóm có sidebar/menu khác nhau, hardcode 1 layout sẽ sai cho 1 phía.
    // Giải pháp: Detect role từ context và pick layout component ngay khi render, action sidebar hiển thị theo role.
    const isRecruiter = user?.role === 'recruiter' || user?.role === 'admin';

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
    const modalRef = useRef(null);

    const modalOpen = !isRecruiter && showModal;

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

    // Vấn đề: Modal có aria-modal="true" nhưng focus vẫn ở ngoài nó — screen reader coi phần còn
    // lại của trang là ẩn trong khi bàn phím vẫn Tab ra được các nút phía sau lớp phủ. Người dùng
    // bàn phím bị "mất" con trỏ và không biết mình đang ở đâu.
    // Giải pháp: Khi mở, đưa focus vào phần tử đầu tiên trong modal và giữ Tab quay vòng bên trong;
    // khi đóng, trả focus về đúng nút vừa bấm để không mất mạch thao tác.
    // Effect này CHỈ phụ thuộc modalOpen — nếu thêm isApplying vào deps thì mỗi lần submit focus
    // sẽ bị kéo về phần tử đầu giữa lúc user đang chờ.
    useEffect(() => {
        if (!modalOpen) return;

        const previouslyFocused = document.activeElement;
        const node = modalRef.current;

        const getFocusable = () => node
            ? Array.from(node.querySelectorAll(
                'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
            ))
            : [];

        getFocusable()[0]?.focus();

        const handleTab = (e) => {
            if (e.key !== 'Tab') return;
            const items = getFocusable();
            if (items.length === 0) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleTab);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleTab);
            document.body.style.overflow = previousOverflow;
            if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
        };
    }, [modalOpen]);

    // Escape tách riêng khỏi effect focus: nó cần đọc isApplying mới nhất (không cho đóng giữa lúc
    // đang upload CV, đúng như hành vi của nút X), nhưng không được kéo focus mỗi lần isApplying đổi.
    useEffect(() => {
        if (!modalOpen) return;
        const handleEscape = (e) => {
            if (e.key === 'Escape' && !isApplying) setShowModal(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [modalOpen, isApplying]);

    // Format lương USD
    const formatSalary = (min, max) => {
        if (!min && !max) return 'Thỏa thuận';
        if (!min) return `Lên đến $${max}`;
        if (!max) return `Từ $${min}`;
        return `$${min} - $${max}`;
    };

    // Vấn đề: User có thể chọn file ảnh hoặc file lớn vượt giới hạn server (5MB) → upload lãng phí băng thông và bị reject; cần tự dọn flow sau khi nộp thành công.
    // Giải pháp: Validate size phía FE trước khi gọi API, dùng FormData cho multipart, setTimeout 2s cho user thấy success rồi mới redirect.
    const handleApply = async (e) => {
        e.preventDefault();
        if (!file) return setError('Vui lòng chọn file CV (Định dạng PDF)');

        if (file.size > 5 * 1024 * 1024) {
            return setError('Kích thước file CV không được vượt quá 5MB');
        }

        setIsApplying(true);
        setError('');

        const formData = new FormData();
        formData.append('cv', file);
        if (coverLetter) formData.append('coverLetter', coverLetter);

        try {
            await api.post(`/applications/${id}/apply`, formData);
            setSuccess(true);
            setTimeout(() => {
                navigate('/applications');
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
                {/* Skeleton dựng đúng khung 2 cột sắp hiện, thay spinner giữa màn hình */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-busy="true" aria-label="Đang tải thông tin việc làm">
                    <div className="lg:col-span-2 space-y-3">
                        <div className="border border-border rounded-lg p-5 space-y-3">
                            <Skeleton className="h-6 w-2/3" />
                            <Skeleton className="h-4 w-1/3" />
                        </div>
                        <div className="border border-border rounded-lg p-5">
                            <SkeletonText lines={6} />
                        </div>
                    </div>
                    <div className="border border-border rounded-lg p-5 space-y-3 h-fit">
                        <Skeleton className="h-11 w-full" />
                        <SkeletonText lines={2} />
                    </div>
                </div>
            </Layout>
        );
    }

    if (!job) {
        return (
            <Layout>
                <div className="border border-border rounded-lg bg-surface-raised p-10 max-w-xl">
                    <h1 className="text-base font-semibold text-text-main">Không tìm thấy tin tuyển dụng này</h1>
                    <p className="text-sm text-text-muted mt-2">
                        Tin có thể đã được nhà tuyển dụng đóng lại hoặc đã hết hạn nhận hồ sơ.
                    </p>
                    <Button variant="outline" size="sm" className="mt-5" onClick={() => navigate(-1)}>
                        Quay lại
                    </Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-main transition-colors cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
                <ChevronLeft size={16} aria-hidden="true" /> Quay lại
            </button>

            {/* Bất đối xứng 2:1 phục vụ thứ tự đọc: ứng viên đọc mô tả trước, cột hành động bên phải
                đứng yên (sticky) để nút Ứng tuyển luôn trong tầm mắt khi cuộn nội dung dài. */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-3">
                    <div className="border border-border rounded-lg bg-surface-raised p-5">
                        <h1 className="text-2xl font-semibold text-text-main">{job.title}</h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-text-muted">
                            <span>{job.recruiter?.companyName || 'Công ty ẩn danh'}</span>
                            <span className="inline-flex items-center gap-1.5">
                                <MapPin size={14} className="text-text-subtle" aria-hidden="true" />
                                {job.location}
                            </span>
                        </div>

                        {/* Ba số liệu chính dùng <dl>: nhãn nhỏ màu nhạt, giá trị đậm màu chính —
                            phân cấp bằng cân nặng và màu, không bằng cỡ chữ. */}
                        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-border-subtle">
                            <div>
                                <dt className="text-xs text-text-subtle">Mức lương</dt>
                                <dd className="text-sm font-semibold text-text-main mt-0.5">{formatSalary(job.salaryMin, job.salaryMax)}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-text-subtle">Hình thức</dt>
                                <dd className="text-sm font-semibold text-text-main mt-0.5">{job.type}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-text-subtle">Cấp bậc</dt>
                                <dd className="text-sm font-semibold text-text-main mt-0.5">{job.level}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="border border-border rounded-lg bg-surface-raised p-5 space-y-6">
                        <section>
                            <h2 className="text-base font-semibold text-text-main mb-2">Mô tả công việc</h2>
                            <div className="text-sm text-text-muted whitespace-pre-wrap">
                                {job.description}
                            </div>
                        </section>
                        <section>
                            <h2 className="text-base font-semibold text-text-main mb-2">Yêu cầu ứng viên</h2>
                            <div className="text-sm text-text-muted whitespace-pre-wrap">
                                {job.requirements}
                            </div>
                        </section>
                        {job.skills && job.skills.length > 0 && (
                            <section>
                                <h2 className="text-base font-semibold text-text-main mb-2">Kỹ năng yêu cầu</h2>
                                <div className="flex flex-wrap gap-1.5">
                                    {job.skills.map((skill, idx) => (
                                        <span key={idx} className="px-2 py-0.5 rounded-sm border border-border text-xs font-medium text-text-muted">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div>
                    <div className="border border-border rounded-lg bg-surface-raised p-5 sticky top-20">
                        {isRecruiter ? (
                            <>
                                <h2 className="text-base font-semibold text-text-main">Công cụ quản lý</h2>
                                <p className="text-sm text-text-muted mt-1 mb-4">
                                    Bạn đang xem tin này dưới góc nhìn nhà tuyển dụng.
                                </p>

                                <div className="space-y-2">
                                    <Link to={`/recruiter/candidates?jobId=${id}`} className={linkButtonPrimary}>
                                        <Users size={16} aria-hidden="true" /> Xem ứng viên ({job.applicantCount || 0})
                                    </Link>
                                    <Link to={`/recruiter/jobs/${id}/edit`} className={linkButtonOutline}>
                                        <Edit size={16} aria-hidden="true" /> Chỉnh sửa tin
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-base font-semibold text-text-main">Nộp hồ sơ</h2>
                                <p className="text-sm text-text-muted mt-1 mb-4">
                                    Bạn cần một file CV dạng PDF. Thư giới thiệu không bắt buộc.
                                </p>
                                <Button onClick={() => setShowModal(true)} fullWidth>
                                    <Send size={16} aria-hidden="true" /> Ứng tuyển
                                </Button>
                            </>
                        )}

                        <div className="mt-5 pt-5 border-t border-border-subtle">
                            <h3 className="text-sm font-semibold text-text-main mb-3">Về công ty</h3>
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-sm border border-border bg-surface flex items-center justify-center shrink-0 overflow-hidden">
                                    <img
                                        src={job.recruiter?.companyLogo || `https://ui-avatars.com/api/?name=${job.recruiter?.companyName || 'C'}&background=f1f5f9&color=475569`}
                                        alt=""
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-text-main truncate">{job.recruiter?.companyName || 'Công ty ẩn danh'}</div>
                                    {job.recruiter?.companyWebsite && (
                                        <a href={job.recruiter.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline rounded-sm">
                                            Website công ty
                                        </a>
                                    )}
                                </div>
                            </div>
                            {job.recruiter?.companyDesc && (
                                <p className="text-sm text-text-muted mt-3 line-clamp-3">
                                    {job.recruiter.companyDesc}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Vấn đề: Modal apply là form lớn, render kể cả khi user là HR sẽ tốn DOM và tăng risk crash khi state không khớp role.
                Giải pháp: Render modal có điều kiện !isRecruiter && showModal để DOM nhẹ và logic rõ ràng theo role. */}
            {modalOpen && (
                <div className="fixed inset-0 bg-neutral-900/50 z-50 flex items-center justify-center p-4">
                    {/* Modal là lớp nổi thật sự nên đây là một trong hai chỗ duy nhất được dùng shadow;
                        bo 12px theo bậc "modal" của thang bo góc. */}
                    <div
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="apply-modal-title"
                        className="bg-surface-raised border border-border rounded-2xl shadow-xl w-full max-w-lg p-5 sm:p-6 relative animate-in fade-in duration-200"
                    >
                        <button
                            type="button"
                            onClick={() => !isApplying && setShowModal(false)}
                            aria-label="Đóng"
                            className="absolute top-4 right-4 p-1.5 rounded-sm text-text-subtle hover:text-text-main hover:bg-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                            <X size={18} aria-hidden="true" />
                        </button>

                        {success ? (
                            <div className="py-4" role="status">
                                <div className="flex items-center gap-2 text-success">
                                    <CheckCircle2 size={20} aria-hidden="true" />
                                    <h2 id="apply-modal-title" className="text-base font-semibold text-text-main">Đã nộp hồ sơ</h2>
                                </div>
                                <p className="text-sm text-text-muted mt-2">
                                    Đơn của bạn đã vào danh sách của nhà tuyển dụng. Đang chuyển sang trang theo dõi đơn…
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleApply}>
                                <h2 id="apply-modal-title" className="text-base font-semibold text-text-main pr-8">
                                    Ứng tuyển vị trí này
                                </h2>
                                <p className="text-sm text-text-muted mt-1 mb-5 line-clamp-1">{job.title}</p>

                                {error && (
                                    <div
                                        role="alert"
                                        className="flex items-start gap-2.5 p-3 mb-5 rounded-sm border border-danger-100 bg-danger-50 text-sm text-danger-700"
                                    >
                                        <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <span className="block text-sm font-semibold text-text-main mb-2">
                                            CV của bạn <span className="text-danger">*</span>
                                        </span>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={(e) => setFile(e.target.files[0])}
                                        />
                                        {/* Vấn đề: Vùng chọn file là <div onClick> nên không tab tới được —
                                            và nó lại là trường bắt buộc duy nhất của form này.
                                            Giải pháp: <button type="button"> để không submit form khi bấm. */}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`w-full border border-dashed rounded-sm p-5 text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${
                                                file ? 'border-primary bg-primary-50' : 'border-border-strong hover:border-primary hover:bg-surface'
                                            }`}
                                        >
                                            <UploadCloud
                                                className={`mx-auto mb-2 ${file ? 'text-primary' : 'text-text-subtle'}`}
                                                size={22}
                                                aria-hidden="true"
                                            />
                                            {file ? (
                                                <span className="block text-sm font-semibold text-primary truncate px-4">{file.name}</span>
                                            ) : (
                                                <>
                                                    <span className="block text-sm font-semibold text-text-main">Chọn file CV</span>
                                                    <span className="block text-xs text-text-muted mt-0.5">PDF, tối đa 5MB</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <Textarea
                                        label="Thư giới thiệu"
                                        hint="Không bắt buộc. Nếu viết, hãy nói ngắn vì sao bạn phù hợp với vị trí này."
                                        placeholder="Ví dụ: Tôi có 3 năm làm React ở sản phẩm có 50 nghìn người dùng…"
                                        value={coverLetter}
                                        onChange={(e) => setCoverLetter(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                </div>

                                <Button type="submit" fullWidth isLoading={isApplying} className="mt-5">
                                    Nộp hồ sơ
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </Layout>
    );
}
