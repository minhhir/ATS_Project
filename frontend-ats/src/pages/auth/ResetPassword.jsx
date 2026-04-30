import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { AuthLayout } from '@/layout/AuthLayout';
import api from '@/api/axios';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function ResetPassword() {
    const location = useLocation();
    const email = location.state?.email;
    const otp = location.state?.otp;

    const [form, setForm] = useState({ password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    // Nếu user truy cập trái phép mà không có email/otp từ bước trước
    if (!email || !otp) {
        return (
            <AuthLayout>
                <div className="text-center space-y-4">
                    <AlertCircle className="w-16 h-16 text-danger mx-auto" />
                    <h1 className="text-xl font-bold">Phiên làm việc không hợp lệ</h1>
                    <Link to="/forgot-password" className="text-primary font-semibold hover:underline block">Quay lại yêu cầu đặt mật khẩu</Link>
                </div>
            </AuthLayout>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) return setError('Mật khẩu xác nhận không khớp');
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/reset-password', { email, otp, newPassword: form.password });
            setIsSuccess(true);
        } catch (err) {
            setError(err?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // MÀN HÌNH THÔNG BÁO THÀNH CÔNG
    if (isSuccess) {
        return (
            <AuthLayout>
                <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-10 h-10 text-success" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-text-main mb-2">Đổi mật khẩu thành công!</h1>
                        <p className="text-text-muted font-medium">Bạn đã có thể sử dụng mật khẩu mới để đăng nhập vào hệ thống.</p>
                    </div>
                    <Link to="/login" className="block w-full">
                        <Button className="w-full">Đăng nhập ngay</Button>
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-text-main">Đặt mật khẩu mới</h1>
                    <p className="text-text-muted mt-2 text-sm font-medium">Vui lòng tạo một mật khẩu mạnh mà bạn chưa từng sử dụng trước đây.</p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-sm font-medium">
                        <AlertCircle size={18} /><span>{error}</span>
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <Input
                        name="password" label="Mật khẩu mới" type="password" placeholder="••••••••"
                        value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required autoFocus
                    />
                    <Input
                        name="confirmPassword" label="Xác nhận mật khẩu mới" type="password" placeholder="••••••••"
                        value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required
                    />
                    <Button type="submit" className="w-full mt-4" isLoading={loading}>
                        Lưu thay đổi
                    </Button>
                </form>
            </div>
        </AuthLayout>
    );
}