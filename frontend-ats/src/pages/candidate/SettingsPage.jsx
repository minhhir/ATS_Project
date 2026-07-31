import { useState, useEffect, useRef } from 'react';
import { CandidateLayout } from '@/layout/CandidateLayout';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';
import { Save, Camera, User, FileText, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { ChangePasswordForm } from '@/components/shared/ChangePasswordForm';

export function SettingsPage() {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // State quản lý thông tin chữ
    const [form, setForm] = useState({
        name: '',
        phone: '',
        skills: ''
    });

    // State quản lý file Ảnh & CV
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [cvFile, setCvFile] = useState(null);
    const [currentCv, setCurrentCv] = useState(null);

    const avatarInputRef = useRef(null);
    const cvInputRef = useRef(null);

    // Vấn đề: User có thể null khi mount lần đầu (đang load auth), gán thẳng user.skills sẽ crash; skills schema là array nhưng input UI là chuỗi.
    // Giải pháp: Optional chaining + fallback ''; join skills thành CSV để hiển thị, sẽ split lại khi submit.
    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                phone: user.phone || '',
                skills: user.skills?.join(', ') || ''
            });
            setAvatarPreview(user.avatar || null);
            setCurrentCv(user.cvUrl || null);
        }
    }, [user]);

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleCvChange = (e) => {
        const file = e.target.files[0];
        if (file) setCvFile(file);
    };

    const handleSubmitProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('phone', form.phone);
            formData.append('skills', form.skills);

            if (avatarFile) formData.append('avatar', avatarFile);
            if (cvFile) formData.append('cv', cvFile);

            const { data } = await api.put('/auth/profile', formData);

            if (updateUser) updateUser(data.data); // Cập nhật Header
            setCurrentCv(data.data.cvUrl); // Cập nhật link CV mới nếu có

            setMessage({ type: 'success', text: 'Cập nhật hồ sơ cá nhân thành công!' });
            setAvatarFile(null);
            setCvFile(null);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Lưu thất bại. Vui lòng thử lại.' });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    const isError = message.type === 'error';

    return (
        <CandidateLayout>
            <div>
                <h1 className="text-2xl font-semibold text-text-main">Hồ sơ của bạn</h1>
                <p className="text-sm text-text-muted mt-1">
                    Thông tin và CV ở đây là những gì nhà tuyển dụng thấy khi bạn nộp đơn.
                </p>
            </div>

            {/* Vấn đề: Thông báo kết quả trước đây dùng emerald/red thô và không có role,
                screen reader không đọc được là đã lưu xong hay lỗi.
                Giải pháp: Token success/danger + role="status"/"alert" + icon cạnh chữ. */}
            {message.text && (
                <div
                    role={isError ? 'alert' : 'status'}
                    className={`flex items-start gap-2.5 p-3 rounded-sm border text-sm ${
                        isError
                            ? 'border-danger-100 bg-danger-50 text-danger-700'
                            : 'border-success-100 bg-success-50 text-success-700'
                    }`}
                >
                    {isError
                        ? <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
                        : <CheckCircle2 size={18} className="shrink-0 mt-0.5" aria-hidden="true" />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* KHỐI 1: HỒ SƠ CÁ NHÂN VÀ CV */}
            <section className="border border-border rounded-lg bg-surface-raised">
                <div className="px-5 py-4 border-b border-border-subtle">
                    <h2 className="text-base font-semibold text-text-main">Thông tin cá nhân & CV</h2>
                </div>

                <div className="p-5 flex flex-col md:flex-row gap-8 items-start">
                    {/* Khu vực up Avatar */}
                    <div className="flex flex-col items-center shrink-0">
                        <div className="w-24 h-24 rounded-full border border-border bg-surface overflow-hidden flex items-center justify-center">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Ảnh đại diện hiện tại" className="w-full h-full object-cover" />
                            ) : (
                                <User size={32} className="text-text-subtle" aria-hidden="true" />
                            )}
                        </div>
                        <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={handleAvatarChange} />
                        <button
                            type="button"
                            onClick={() => avatarInputRef.current.click()}
                            className="mt-3 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-white text-sm font-semibold text-text-main transition-colors cursor-pointer hover:bg-surface hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                        >
                            <Camera size={15} aria-hidden="true" /> Đổi ảnh
                        </button>
                    </div>

                    {/* Form thông tin */}
                    <div className="flex-1 w-full space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Họ và tên" name="name" value={form.name} onChange={handleChange} autoComplete="name" />
                            <Input label="Số điện thoại" name="phone" value={form.phone} onChange={handleChange} autoComplete="tel" />
                        </div>

                        {/* Dùng luôn component Input cho email và kỹ năng thay vì input thô:
                            trước đây hai ô này có bo góc và padding riêng nên lệch hẳn với hai ô trên. */}
                        <Input
                            label="Email đăng nhập"
                            type="text"
                            value={user?.email || ''}
                            disabled
                            hint="Email dùng để đăng nhập nên không đổi được ở đây."
                        />

                        <Input
                            label="Kỹ năng chuyên môn"
                            name="skills"
                            placeholder="React, Node.js, SQL"
                            value={form.skills}
                            onChange={handleChange}
                            hint="Ngăn cách bằng dấu phẩy. Hệ thống dùng danh sách này để chấm độ khớp CV với tin tuyển dụng."
                        />

                        {/* Quản lý CV */}
                        <div className="pt-5 border-t border-border-subtle">
                            <span className="block text-sm font-semibold text-text-main mb-2">CV gốc</span>
                            <input type="file" accept=".pdf" className="hidden" ref={cvInputRef} onChange={handleCvChange} />

                            {/* Vấn đề: Vùng chọn file trước đây là <div onClick> — người dùng bàn phím
                                không tab tới được, không bấm được bằng Enter/Space.
                                Giải pháp: Đổi sang <button type="button">, giữ nguyên onClick. */}
                            <button
                                type="button"
                                onClick={() => cvInputRef.current.click()}
                                className={`w-full border border-dashed rounded-sm p-5 text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${
                                    cvFile
                                        ? 'border-primary bg-primary-50'
                                        : 'border-border-strong hover:border-primary hover:bg-surface'
                                }`}
                            >
                                <UploadCloud
                                    className={`mx-auto mb-2 ${cvFile ? 'text-primary' : 'text-text-subtle'}`}
                                    size={22}
                                    aria-hidden="true"
                                />
                                {cvFile ? (
                                    <span className="block text-sm font-semibold text-primary truncate px-4">{cvFile.name}</span>
                                ) : (
                                    <>
                                        <span className="block text-sm font-semibold text-text-main">Chọn file CV</span>
                                        <span className="block text-xs text-text-muted mt-0.5">PDF, tối đa 5MB</span>
                                    </>
                                )}
                            </button>

                            {/* Hiện CV đã có trên DB (Nếu không chọn file mới) */}
                            {currentCv && !cvFile && (
                                <div className="mt-3 p-3 border border-border rounded-sm flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <FileText size={18} className="text-text-subtle shrink-0" aria-hidden="true" />
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-text-main">CV đang dùng</div>
                                            <div className="text-xs text-text-subtle">Nhà tuyển dụng sẽ nhận file này khi bạn nộp đơn</div>
                                        </div>
                                    </div>
                                    <a
                                        href={currentCv}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium text-primary hover:text-primary-hover hover:underline shrink-0 rounded-sm"
                                    >
                                        Mở CV
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="pt-1">
                            <Button onClick={handleSubmitProfile} isLoading={loading}>
                                <Save size={16} aria-hidden="true" /> Lưu hồ sơ & CV
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* KHỐI 2: ĐỔI MẬT KHẨU (Tái sử dụng Component dùng chung) */}
            <ChangePasswordForm />
        </CandidateLayout>
    );
}
