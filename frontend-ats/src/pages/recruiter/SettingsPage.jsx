import { useState, useEffect } from 'react';
import { RecruiterLayout } from '@/layout/RecruiterLayout';
import { Input } from '@/ui/Input';
import { Textarea } from '@/ui/Textarea';
import { Button } from '@/ui/Button';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';
import { Save, Building2, UserCircle } from 'lucide-react';
import { ChangePasswordForm } from '@/components/shared/ChangePasswordForm';

export function SettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [form, setForm] = useState({
        name: '',
        phone: '',
        companyName: '',
        companyWebsite: '',
        companyDesc: ''
    });

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
        }
    }, [user]);

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await api.put('/auth/profile', {
                name: form.name,
                phone: form.phone,
                companyName: form.companyName,
                companyWebsite: form.companyWebsite,
                companyDesc: form.companyDesc
            });
            setMessage('Lưu thay đổi thành công!');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Lưu thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };
    return (
        <RecruiterLayout>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main">Cài đặt hệ thống</h1>
                    <p className="text-text-muted mt-1 font-medium">Quản lý thông tin cá nhân và hồ sơ công ty của bạn.</p>
                </div>
                <Button onClick={handleSubmit} isLoading={loading} className="hidden sm:flex">
                    <Save size={18} /> Lưu thay đổi
                </Button>
            </div>

            {message && (
                <div className={`p-4 mb-6 rounded-xl text-sm font-bold ${message.includes('thành công') ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Cột trái: Menu (Tương lai có thể thêm Đổi mật khẩu, Thông báo...) */}
                <div className="lg:col-span-1 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-white text-primary border border-border shadow-sm rounded-xl font-bold">
                        <Building2 size={20} /> Hồ sơ công ty
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-text-muted hover:bg-surface rounded-xl font-semibold transition-colors">
                        <UserCircle size={20} /> Đổi mật khẩu (Comming Soon)
                    </button>
                </div>

                {/* Cột phải: Form */}
                <div className="lg:col-span-2 space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-sm">

                    <section>
                        <h3 className="text-lg font-extrabold text-text-main mb-4 border-b border-border pb-2">Thông tin người tuyển dụng</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <Input label="Họ và tên" name="name" value={form.name} onChange={handleChange} />
                            <Input label="Số điện thoại cá nhân" name="phone" value={form.phone} onChange={handleChange} />
                        </div>
                    </section>

                    <section className="pt-4">
                        <h3 className="text-lg font-extrabold text-text-main mb-4 border-b border-border pb-2">Thông tin doanh nghiệp</h3>
                        <div className="space-y-5">
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
                            />
                        </div>
                    </section>

                    <div className="pt-6 sm:hidden">
                        <Button onClick={handleSubmit} isLoading={loading} className="w-full">
                            <Save size={18} /> Lưu thay đổi
                        </Button>
                    </div>

                </div>
            </div>
            <ChangePasswordForm />
        </RecruiterLayout>
    );
}