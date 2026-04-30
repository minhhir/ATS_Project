import { useState, useEffect, useRef } from 'react';
import { RecruiterLayout } from '@/layout/RecruiterLayout';
import { Input } from '@/ui/Input';
import { Textarea } from '@/ui/Textarea';
import { Button } from '@/ui/Button';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';
import { Save, Camera, Building2 } from 'lucide-react';
import { ChangePasswordForm } from '@/components/shared/ChangePasswordForm';

export function SettingsPage() {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // State quản lý thông tin
    const [form, setForm] = useState({
        name: '',
        phone: '',
        companyName: '',
        companyWebsite: '',
        companyDesc: ''
    });

    // State quản lý file ảnh Logo/Avatar
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const fileInputRef = useRef(null);

    // Tải thông tin hiện tại của User
    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                phone: user.phone || '',
                companyName: user.companyName || '',
                companyWebsite: user.companyWebsite || '',
                companyDesc: user.companyDesc || ''
            });
            setAvatarPreview(user.avatar || null);
        }
    }, [user]);

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmitProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // ✅ BẮT BUỘC DÙNG FORMDATA ĐỂ CHỨA CẢ CHỮ LẪN ẢNH
            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('phone', form.phone);
            formData.append('companyName', form.companyName);
            formData.append('companyWebsite', form.companyWebsite);
            formData.append('companyDesc', form.companyDesc);

            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            const { data } = await api.put('/auth/profile', formData);

            // Cập nhật lại Context để header/sidebar đổi ảnh ngay lập tức
            if (updateUser) updateUser(data.data);

            setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
            setAvatarFile(null); // Reset file
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Lưu thất bại. Vui lòng thử lại.' });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    return (
        <RecruiterLayout>
            <div className="max-w-5xl mx-auto">
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main">Cài đặt hệ thống</h1>
                        <p className="text-text-muted mt-1 font-medium">Quản lý thông tin cá nhân, hồ sơ công ty và bảo mật.</p>
                    </div>
                </div>

                {message.text && (
                    <div className={`p-4 mb-6 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                        {message.text}
                    </div>
                )}

                <div className="space-y-8">
                    {/* KHỐI 1: HỒ SƠ CÔNG TY VÀ THÔNG TIN CÁ NHÂN */}
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-border shadow-sm space-y-8">
                        <h3 className="text-xl font-extrabold text-text-main border-b border-border pb-4 flex items-center gap-2">
                            <Building2 size={24} className="text-primary" /> Hồ sơ công ty & Cá nhân
                        </h3>

                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Khu vực up Logo */}
                            <div className="flex flex-col items-center shrink-0">
                                <div className="relative w-32 h-32 rounded-2xl border-4 border-surface bg-surface overflow-hidden flex items-center justify-center">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Company Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <Building2 size={48} className="text-text-muted" />
                                    )}
                                </div>
                                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                                <button onClick={() => fileInputRef.current.click()} className="mt-4 flex items-center gap-2 text-sm font-bold text-primary hover:bg-primary/10 px-4 py-2 rounded-xl transition-colors">
                                    <Camera size={16} /> Tải Logo lên
                                </button>
                            </div>

                            {/* Form thông tin */}
                            <div className="flex-1 space-y-6 w-full">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <Input label="Tên công ty" name="companyName" value={form.companyName} onChange={handleChange} />
                                    <Input label="Website công ty" name="companyWebsite" placeholder="https://" value={form.companyWebsite} onChange={handleChange} />
                                </div>
                                <Textarea
                                    label="Giới thiệu về công ty"
                                    name="companyDesc"
                                    placeholder="Viết vài dòng giới thiệu về môi trường làm việc, văn hóa doanh nghiệp..."
                                    value={form.companyDesc}
                                    onChange={handleChange}
                                    rows={4}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-border">
                                    <Input label="Họ tên người tuyển dụng" name="name" value={form.name} onChange={handleChange} />
                                    <Input label="Số điện thoại liên hệ" name="phone" value={form.phone} onChange={handleChange} />
                                </div>

                                <div className="pt-2">
                                    <Button onClick={handleSubmitProfile} isLoading={loading} className="px-8 py-3">
                                        <Save size={18} /> Lưu hồ sơ
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KHỐI 2: ĐỔI MẬT KHẨU (Import từ shared component) */}
                    <ChangePasswordForm />
                </div>
            </div>
        </RecruiterLayout>
    );
}