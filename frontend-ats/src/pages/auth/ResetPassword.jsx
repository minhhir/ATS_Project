import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { AuthLayout } from '@/layout/AuthLayout';
import api from '@/api/axios';

// Vấn đề: Trước đây màn thành công dùng <Link><Button/></Link> — lồng <button> trong <a> là HTML
// không hợp lệ và screen reader đọc ra hai phần tử tương tác chồng nhau.
// Giải pháp: Link mang trực tiếp bộ class của nút chính. Giữ đúng kích thước/bo góc của Button
// để không sinh ra một biến thể nút thứ hai ngoài hệ thống.
const primaryLinkClasses =
    'inline-flex items-center justify-center w-full h-11 px-4 rounded-lg text-sm font-semibold ' +
    'bg-primary text-white transition-colors duration-200 ease-smooth hover:bg-primary-hover ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2';

export function ResetPassword() {
    const location = useLocation();
    const email = location.state?.email;
    const otp = location.state?.otp;

    const [form, setForm] = useState({ password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    // Vấn đề: Reset password phải đi tuần tự forgot → verify-otp → reset; user vào thẳng /reset-password sẽ bị gửi request thiếu OTP.
    // Giải pháp: Check state có email + otp không, thiếu thì hiển thị màn hình "phiên không hợp lệ" thay vì cho submit.
    if (!email || !otp) {
        return (
            <AuthLayout>
                {/* Icon nhỏ đặt cạnh tiêu đề, không phải khối tròn nền tint cỡ 64px giữa màn hình:
                    đây là thông báo cần đọc rồi hành động, không phải hình minh hoạ. */}
                <div className="space-y-8" role="alert">
                    <div>
                        <div className="flex items-center gap-2 text-danger">
                            <AlertCircle size={20} aria-hidden="true" />
                            <h1 className="text-2xl font-semibold text-text-main">Phiên đã hết hạn</h1>
                        </div>
                        <p className="text-sm text-text-muted mt-2">
                            Mã xác nhận chỉ dùng được một lần và trong thời gian ngắn. Hãy yêu cầu mã mới để đặt lại mật khẩu.
                        </p>
                    </div>

                    <Link to="/forgot-password" className={primaryLinkClasses}>
                        Yêu cầu mã mới
                    </Link>
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
                {/* role="status" để screen reader thông báo kết quả — người dùng vừa submit và
                    cần biết việc đã xong, nhưng không cần cắt ngang như role="alert". */}
                <div className="space-y-8" role="status">
                    <div>
                        <div className="flex items-center gap-2 text-success">
                            <CheckCircle2 size={20} aria-hidden="true" />
                            <h1 className="text-2xl font-semibold text-text-main">Đã đổi mật khẩu</h1>
                        </div>
                        <p className="text-sm text-text-muted mt-2">
                            Từ giờ hãy dùng mật khẩu mới để đăng nhập.
                        </p>
                    </div>

                    <Link to="/login" className={primaryLinkClasses}>
                        Đăng nhập
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-semibold text-text-main">Đặt mật khẩu mới</h1>
                    <p className="text-sm text-text-muted mt-2">
                        Chọn mật khẩu bạn chưa dùng ở nơi nào khác.
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {error && (
                        <div
                            role="alert"
                            className="flex items-start gap-2.5 p-3 rounded-sm border border-danger-100 bg-danger-50 text-sm text-danger-700"
                        >
                            <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{error}</span>
                        </div>
                    )}

                    <Input
                        name="password"
                        label="Mật khẩu mới"
                        type="password"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        autoComplete="new-password"
                        required
                        autoFocus
                    />
                    <Input
                        name="confirmPassword"
                        label="Nhập lại mật khẩu mới"
                        type="password"
                        value={form.confirmPassword}
                        onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                        autoComplete="new-password"
                        required
                    />

                    <Button type="submit" fullWidth isLoading={loading} className="mt-2">
                        Lưu mật khẩu mới
                    </Button>
                </form>
            </div>
        </AuthLayout>
    );
}
