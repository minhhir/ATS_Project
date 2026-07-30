import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { AuthLayout } from '@/layout/AuthLayout';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle } from 'lucide-react';

export function RegisterPage() {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', companyName: '', role: 'candidate' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    // Vấn đề: User chuyển role từ recruiter→candidate nhưng companyName cũ vẫn còn trong state, sẽ gửi field thừa lên server.
    // Giải pháp: Reset companyName về '' mỗi lần đổi role.
    const setRole = (role) => setForm(prev => ({ ...prev, role, companyName: '' }));

    // Vấn đề: Nếu submit cả khi password mismatch hoặc gửi companyName cho candidate, server sẽ trả lỗi tốn round-trip; FE/BE cần đồng bộ payload theo role.
    // Giải pháp: Validate confirmPassword phía client, build payload có conditional spread companyName chỉ khi role=recruiter.
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) return setError('Mật khẩu xác nhận không khớp!');
        setLoading(true);
        setError('');

        try {
            const payload = {
                name: form.name,
                email: form.email,
                password: form.password,
                role: form.role,
                ...(form.role === 'recruiter' && { companyName: form.companyName })
            };

            const user = await register(payload);
            const home = { candidate: '/jobs', recruiter: '/recruiter/dashboard' };
            navigate(home[user.role] || '/');
        } catch (err) {
            setError(err?.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-text-main">Tạo tài khoản</h1>
                    <p className="text-text-muted mt-2 text-sm font-medium">Tham gia nền tảng tuyển dụng thông minh</p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-sm font-medium">
                        <AlertCircle size={18} /><span>{error}</span>
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Role Toggle */}
                    <div className="flex p-1 bg-surface rounded-xl border border-border">
                        <button type="button" onClick={() => setRole('candidate')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${form.role === 'candidate' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}>
                            Ứng viên
                        </button>
                        <button type="button" onClick={() => setRole('recruiter')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${form.role === 'recruiter' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}>
                            Nhà tuyển dụng
                        </button>
                    </div>

                    <Input name="name" label="Họ và tên" placeholder="Nguyễn Văn A" value={form.name} onChange={handleChange} required />
                    <Input name="email" label="Địa chỉ Email" type="email" placeholder="name@company.com" value={form.email} onChange={handleChange} required />

                    {form.role === 'recruiter' && (
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                            <Input name="companyName" label="Tên công ty" placeholder="Công ty TNHH ABC" value={form.companyName} onChange={handleChange} required />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Input name="password" label="Mật khẩu" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
                        <Input name="confirmPassword" label="Xác nhận lại" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} required />
                    </div>

                    <Button type="submit" className="w-full mt-2" isLoading={loading}>
                        Tạo tài khoản
                    </Button>
                </form>

                <p className="text-center text-sm font-medium text-text-muted pt-4">
                    Đã có tài khoản? <Link to="/login" className="text-primary font-bold hover:underline">Đăng nhập</Link>
                </p>
            </div>
        </AuthLayout>
    );
}