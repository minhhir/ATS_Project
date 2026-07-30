import { useState, useEffect, useRef } from 'react';
import { CandidateLayout } from '@/layout/CandidateLayout';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';
import { Save, Camera, User, FileText, UploadCloud, BrainCircuit } from 'lucide-react';
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

    return (
        <CandidateLayout>
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main">Cài đặt tài khoản</h1>
                    <p className="text-text-muted mt-1 font-medium">Quản lý thông tin cá nhân, hồ sơ ứng tuyển và bảo mật.</p>
                </div>

                {message.text && (
                    <div className={`p-4 mb-6 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                        {message.text}
                    </div>
                )}

                <div className="space-y-8">
                    {/* KHỐI 1: HỒ SƠ CÁ NHÂN VÀ CV */}
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-border shadow-sm space-y-8">
                        <h3 className="text-xl font-extrabold text-text-main border-b border-border pb-4 flex items-center gap-2">
                            <User size={24} className="text-primary" /> Thông tin cá nhân & CV
                        </h3>

                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Khu vực up Avatar */}
                            <div className="flex flex-col items-center shrink-0">
                                <div className="relative w-32 h-32 rounded-full border-4 border-surface bg-surface overflow-hidden flex items-center justify-center">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={48} className="text-text-muted" />
                                    )}
                                </div>
                                <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={handleAvatarChange} />
                                <button onClick={() => avatarInputRef.current.click()} className="mt-4 flex items-center gap-2 text-sm font-bold text-primary hover:bg-primary/10 px-4 py-2 rounded-xl transition-colors">
                                    <Camera size={16} /> Đổi ảnh
                                </button>
                            </div>

                            {/* Form thông tin */}
                            <div className="flex-1 space-y-6 w-full">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <Input label="Họ và tên" name="name" value={form.name} onChange={handleChange} />
                                    <Input label="Số điện thoại" name="phone" value={form.phone} onChange={handleChange} />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-text-main mb-2">Email (Tài khoản đăng nhập)</label>
                                    <input type="text" value={user?.email || ''} disabled className="w-full px-4 py-3 rounded-xl border border-border bg-gray-100 text-text-muted font-medium cursor-not-allowed outline-none" />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-text-main mb-2">
                                        <BrainCircuit size={18} className="text-primary" /> Kỹ năng chuyên môn
                                    </label>
                                    <input
                                        type="text"
                                        name="skills"
                                        placeholder="Ví dụ: React, Node.js, Python..."
                                        value={form.skills}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                                    />
                                    <p className="text-xs text-text-muted mt-2 font-medium">Dùng dấu phẩy (,) để ngăn cách các kỹ năng.</p>
                                </div>

                                {/* Quản lý CV */}
                                <div className="pt-4 border-t border-border">
                                    <label className="block text-sm font-bold text-text-main mb-4">CV gốc (Định dạng PDF, Max 5MB)</label>
                                    <input type="file" accept=".pdf" className="hidden" ref={cvInputRef} onChange={handleCvChange} />

                                    <div
                                        onClick={() => cvInputRef.current.click()}
                                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${cvFile ? 'border-primary bg-primary-light/30' : 'border-border hover:border-primary hover:bg-surface'}`}
                                    >
                                        <UploadCloud className={`mx-auto mb-2 ${cvFile ? 'text-primary' : 'text-text-muted'}`} size={32} />
                                        {cvFile ? (
                                            <div className="font-bold text-primary truncate px-4">{cvFile.name}</div>
                                        ) : (
                                            <div className="font-bold text-text-main">Click để chọn file CV mới</div>
                                        )}
                                    </div>

                                    {/* Hiện CV đã có trên DB (Nếu không chọn file mới) */}
                                    {currentCv && !cvFile && (
                                        <div className="mt-4 p-4 bg-surface rounded-xl border border-border flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-text-main text-sm">Hồ sơ hiện tại</div>
                                                    <div className="text-xs text-text-muted">Đã lưu trên hệ thống</div>
                                                </div>
                                            </div>
                                            <a href={currentCv} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:underline">
                                                Xem CV
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <Button onClick={handleSubmitProfile} isLoading={loading} className="px-8 py-3">
                                        <Save size={18} /> Lưu hồ sơ & CV
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KHỐI 2: ĐỔI MẬT KHẨU (Tái sử dụng Component dùng chung) */}
                    <ChangePasswordForm />
                </div>
            </div>
        </CandidateLayout>
    );
}