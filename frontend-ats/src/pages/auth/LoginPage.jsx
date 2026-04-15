import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { AuthLayout } from '@/layout/AuthLayout';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [rememberMe, setRememberMe] = useState(false); // ✅ Thêm state cho Nhớ mật khẩu
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // ✅ Kẹp thêm rememberMe vào payload gửi xuống hàm login
            const user = await login({ ...form, rememberMe });
            const from = location.state?.from?.pathname;
            if (from) {
                return navigate(from, { replace: true });
            }
            const homePaths = {
                candidate: '/jobs',
                recruiter: '/recruiter/dashboard',
                admin: '/admin/dashboard'
            };
            navigate(homePaths[user.role] || '/');
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-text-main">Chào mừng trở lại!</h1>
                <p className="text-text-muted mt-2 text-sm">Đăng nhập để tiếp tục hành trình sự nghiệp của bạn.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-lg">
                        {error}
                    </div>
                )}

                <Input
                    label="Email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="Mật khẩu"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                />

                {/* ✅ KHU VỰC CHECKBOX NHỚ MẬT KHẨU (Quick Fix chuẩn) */}
                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={e => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-border text-primary cursor-pointer focus:ring-primary/20"
                        />
                        <span className="text-sm font-medium text-text-muted">Nhớ mật khẩu</span>
                    </label>
                    <Link to="/forgot-password" className="text-sm font-bold text-primary hover:underline">
                        Quên mật khẩu?
                    </Link>
                </div>

                <Button type="submit" className="w-full mt-2" isLoading={loading}>
                    Đăng nhập
                </Button>
            </form>

            <p className="text-center text-sm text-text-muted mt-6">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="font-bold text-primary hover:underline">
                    Đăng ký ngay
                </Link>
            </p>
        </AuthLayout>
    );
}