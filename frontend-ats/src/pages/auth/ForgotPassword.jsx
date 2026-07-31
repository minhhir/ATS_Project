import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { AuthLayout } from '@/layout/AuthLayout';
import api from '@/api/axios';

export function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Vấn đề: Backend cố tình trả success kể cả khi email không tồn tại (chống enumerate); FE phải nhất quán hành vi đó để không lộ thông tin.
    // Giải pháp: Dù response 4xx vẫn navigate sang /verify-otp giữ flow giống nhau cho mọi email; chỉ chặn khi server thực sự lỗi 5xx.
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return setError('Vui lòng nhập email');
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/forgot-password', { email });
            navigate('/verify-otp', { state: { email } });
        } catch (err) {
            if (err?.response?.status >= 500) {
                setError('Hệ thống đang bận. Vui lòng thử lại sau.');
                return;
            }
            navigate('/verify-otp', { state: { email } });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="space-y-8">
                {/* Icon mũi tên đặt cạnh chữ, không bọc trong khối tròn nền tint. */}
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors rounded-sm"
                >
                    <ArrowLeft size={16} aria-hidden="true" /> Quay lại đăng nhập
                </Link>

                <div>
                    <h1 className="text-2xl font-semibold text-text-main">Đặt lại mật khẩu</h1>
                    {/* Nói rõ bước tiếp theo là gì để user không bỏ dở giữa luồng 3 bước
                        (nhập email → nhập mã → đặt mật khẩu mới). */}
                    <p className="text-sm text-text-muted mt-2">
                        Nhập email của tài khoản. Chúng tôi sẽ gửi mã 6 số để xác nhận đó là bạn.
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
                        label="Email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                        autoFocus
                    />

                    <Button type="submit" fullWidth isLoading={loading} className="mt-2">
                        Gửi mã xác nhận
                    </Button>
                </form>
            </div>
        </AuthLayout>
    );
}
