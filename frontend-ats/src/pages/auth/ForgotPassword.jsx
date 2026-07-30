import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { AuthLayout } from '@/layout/AuthLayout';
import api from '@/api/axios';
import { ArrowLeft, AlertCircle } from 'lucide-react';

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
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-primary transition-colors">
                    <ArrowLeft size={16} /> Quay lại
                </Link>

                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-text-main">Quên mật khẩu?</h1>
                    <p className="text-text-muted mt-2 text-sm font-medium">Đừng lo, hãy nhập email của bạn và chúng tôi sẽ gửi mã xác nhận để đặt lại mật khẩu.</p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-sm font-medium">
                        <AlertCircle size={18} /><span>{error}</span>
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <Input
                        label="Địa chỉ Email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                    />

                    <Button type="submit" className="w-full" isLoading={loading}>
                        Gửi mã xác nhận
                    </Button>
                </form>
            </div>
        </AuthLayout>
    );
}