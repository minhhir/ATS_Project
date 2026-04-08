import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { AuthLayout } from '@/layout/AuthLayout';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const from = location.state?.from?.pathname;

    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [showPw, setShowPw] = useState(false);

    const handleChange = (e) => {
        setError('');
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) return setError('Vui lòng nhập đầy đủ email và mật khẩu.');

        setLoading(true);
        try {
            const user = await login({ email: form.email, password: form.password });
            const ROLE_HOME = { candidate: '/jobs', recruiter: '/recruiter/dashboard', admin: '/admin/dashboard' };
            navigate(from || ROLE_HOME[user.role] || '/', { replace: true });
        } catch (err) {
            setError(err?.response?.data?.message || 'Email hoặc mật khẩu không chính xác.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-text-main">Chào mừng trở lại</h1>
                    <p className="text-text-muted mt-2 text-sm font-medium">Đăng nhập để tiếp tục quản lý công việc</p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-sm font-medium">
                        <AlertCircle size={18} /><span>{error}</span>
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <Input
                        name="email"
                        label="Địa chỉ Email"
                        type="email"
                        placeholder="name@company.com"
                        value={form.email}
                        onChange={handleChange}
                        autoFocus
                    />

                    <Input
                        name="password"
                        label="Mật khẩu"
                        // Layout "Quên mật khẩu" nhúng thẳng vào labelRight của Input
                        labelRight={<Link to="/forgot-password" className="text-sm font-bold text-primary hover:text-primary-hover transition-colors">Quên mật khẩu?</Link>}

                        type={showPw ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange}

                        rightIcon={
                            <button
                                type="button"
                                onClick={() => setShowPw(!showPw)}
                                className="focus:outline-none p-1"
                            >
                                {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        }
                    />

                    <Button type="submit" className="w-full mt-2" isLoading={loading}>
                        Đăng nhập
                    </Button>
                </form>

                <p className="text-center text-sm font-medium text-text-muted pt-4">
                    Chưa có tài khoản? <Link to="/register" className="text-primary font-bold hover:underline">Đăng ký ngay</Link>
                </p>
            </div>
        </AuthLayout>
    );
}