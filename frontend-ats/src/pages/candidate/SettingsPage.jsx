import { useState, useEffect } from 'react';
import { CandidateLayout } from '@/layout/CandidateLayout';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';
import { Save, UserCircle, FileText, UploadCloud } from 'lucide-react';

export function SettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [form, setForm] = useState({
        name: '',
        phone: '',
        skills: '',
        cvUrl: ''
    });

    // Tải thông tin hiện tại của Ứng viên
    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                phone: user.phone || '',
                skills: user.skills ? user.skills.join(', ') : '',
                cvUrl: user.cvUrl || ''
            });
        }
    }, [user]);

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            // Gửi API lên Backend
            await api.put('/auth/profile', {
                name: form.name,
                phone: form.phone,
                skills: form.skills
            });
            setMessage('Lưu hồ sơ cá nhân thành công!');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Lưu thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <CandidateLayout>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main">Cài đặt tài khoản</h1>
                    <p className="text-text-muted mt-1 font-medium">Cập nhật hồ sơ và kỹ năng của bạn để nhà tuyển dụng dễ dàng tìm thấy.</p>
                </div>
                <Button onClick={handleSubmit} isLoading={loading} className="hidden sm:flex">
                    <Save size={18} /> Lưu thay đổi
                </Button>
            </div>

            {message && (
                <div className={`p-4 mb-6 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2 ${message.includes('thành công') ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Cột trái: Sidebar Menu */}
                <div className="lg:col-span-1 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-white text-primary border border-border shadow-sm rounded-xl font-bold">
                        <UserCircle size={20} /> Hồ sơ cá nhân
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-text-muted hover:bg-surface rounded-xl font-semibold transition-colors">
                        <FileText size={20} /> Quản lý CV gốc (Comming Soon)
                    </button>
                </div>

                {/* Cột phải: Form */}
                <div className="lg:col-span-2 space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-sm">

                    <section>
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                            <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center text-primary text-2xl font-black shrink-0 border-4 border-white shadow-md">
                                {form.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h3 className="font-bold text-text-main text-lg mb-2">Ảnh đại diện</h3>
                                <Button variant="outline" className="py-1.5 px-3 text-sm">
                                    <UploadCloud size={16} /> Tải ảnh mới
                                </Button>
                            </div>
                        </div>

                        <h3 className="text-lg font-extrabold text-text-main mb-4">Thông tin cơ bản</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <Input label="Họ và tên" name="name" value={form.name} onChange={handleChange} />
                            <Input label="Số điện thoại" name="phone" placeholder="VD: 0987654321" value={form.phone} onChange={handleChange} />
                        </div>

                        <div className="mt-5">
                            <Input
                                label="Kỹ năng chuyên môn (Cách nhau bằng dấu phẩy)"
                                name="skills"
                                placeholder="VD: React, Node.js, Python, Figma..."
                                value={form.skills}
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
        </CandidateLayout>
    );
}