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

    // Vấn đề: Submit có cả text + file ảnh logo, JSON không gửi file được; updateUser context phải sync ngay để sidebar/header thấy logo mới mà không cần F5.
    // Giải pháp: Dùng FormData đa phần, sau khi BE trả user mới thì gọi updateUser để các component dùng useAuth re-render, reset file state để không upload lại.
    const handleSubmitProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
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

            if (updateUser) updateUser(data.data);

            setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
            setAvatarFile(null);
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
                <div className="mb-8">
                    <h1 className="page-title">Hồ sơ công ty</h1>
                    <p className="page-subtitle">Thông tin ở đây hiển thị cho ứng viên khi họ xem tin tuyển dụng của bạn.</p>
                </div>

                {/* Vấn đề: emerald-600 trên emerald-50 chỉ đạt 3.58:1 và red-600 trên red-50 đạt 4.41:1 —
                    cả hai đều trượt AA, mà đây là dòng DUY NHẤT báo hồ sơ công ty đã lưu được hay chưa.
                    Chúng còn là màu Tailwind gốc, nằm ngoài hệ thống token.
                    Giải pháp: bước 700 của token ngữ nghĩa (5.21:1 và 5.91:1), cùng bộ class mà
                    candidate/SettingsPage đã dùng để hai trang settings báo kết quả giống nhau. */}
                {message.text && (
                    <div className={`p-3 mb-6 rounded-sm text-sm animate-in fade-in border ${message.type === 'success' ? 'border-success-100 bg-success-50 text-success-700' : 'border-danger-100 bg-danger-50 text-danger-700'}`}>
                        {message.text}
                    </div>
                )}

                <div className="space-y-8">
                    {/* KHỐI 1: HỒ SƠ CÔNG TY VÀ THÔNG TIN CÁ NHÂN */}
                    <div className="bg-surface-raised p-5 sm:p-6 rounded-lg border border-border space-y-6">
                        <h3 className="text-lg font-bold text-text-main border-b border-border pb-4 flex items-center gap-2">
                            <Building2 size={18} className="text-text-subtle shrink-0" aria-hidden="true" /> Hồ sơ công ty
                        </h3>

                        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                            {/* Khu vực up Logo */}
                            <div className="flex flex-col items-center shrink-0 w-full md:w-auto">
                                {/* Viền 1px thay border-4, bo 8px thay 12px: đây là ô xem trước ảnh, không
                                    phải lớp nổi. Viền dày 4px làm nó trông như khung ảnh treo tường. */}
                                <div className="relative w-32 h-32 rounded-lg border border-border bg-surface overflow-hidden flex items-center justify-center">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Logo công ty" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <Building2 size={32} className="text-text-subtle" aria-hidden="true" />
                                    )}
                                </div>
                                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    className="mt-3 inline-flex items-center gap-2 h-9 px-3 text-sm font-semibold text-text-muted border border-border rounded-lg hover:bg-surface hover:text-text-main hover:border-border-strong transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                                >
                                    <Camera size={16} aria-hidden="true" /> Tải logo lên
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