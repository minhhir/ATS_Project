import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { AuthLayout } from '@/layout/AuthLayout';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    // Vấn đề: Sau login cần đưa user về đúng dashboard theo role; nếu vào từ ProtectedRoute (deep link), user kỳ vọng quay lại trang đó chứ không bị về dashboard.
    // Giải pháp: Ưu tiên location.state.from (lưu khi ProtectedRoute redirect), fallback theo bảng map role → home; mọi lỗi server map về 1 message thân thiện.
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
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
            {/* Nhịp điệu khoảng trắng: 32px giữa các nhóm (tiêu đề / form / chân trang),
                16px giữa các trường trong cùng form. Tỉ lệ 2:1 để mắt thấy rõ đâu là một nhóm. */}
            <div className="space-y-8">
                {/* Căn trái, không căn giữa: mắt người đọc bắt đầu từ góc trên bên trái, và
                    nhãn của các trường bên dưới cũng căn trái — căn giữa tiêu đề tạo hai trục lệch nhau. */}
                <div>
                    <h1 className="text-2xl font-semibold text-text-main">Đăng nhập</h1>
                    <p className="text-sm text-text-muted mt-2">
                        Nhập email và mật khẩu của tài khoản bạn đã đăng ký.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* role="alert" để screen reader đọc ngay khi lỗi xuất hiện, không cần user
                        tự tab tới. Kèm icon cạnh chữ vì không được truyền tin chỉ bằng màu. */}
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
                        name="email"
                        placeholder="name@company.com"
                        value={form.email}
                        onChange={handleChange}
                        autoComplete="email"
                        required
                    />
                    <Input
                        label="Mật khẩu"
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                        required
                    />

                    <div className="flex items-center justify-between gap-4 pt-1">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            {/* form-checkbox là class của @tailwindcss/forms ở strategy 'class'.
                                Không có nó thì checkbox giữ giao diện mặc định của trình duyệt và
                                mọi class màu bên dưới đều vô tác dụng. */}
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={e => setRememberMe(e.target.checked)}
                                className="form-checkbox w-4 h-4 rounded-sm border-border-strong text-primary cursor-pointer focus:ring-2 focus:ring-primary/25 focus:ring-offset-0"
                            />
                            <span className="text-sm text-text-muted">Nhớ mật khẩu</span>
                        </label>
                        <Link
                            to="/forgot-password"
                            className="text-sm font-medium text-primary hover:text-primary-hover hover:underline rounded-sm"
                        >
                            Quên mật khẩu?
                        </Link>
                    </div>

                    <Button type="submit" fullWidth isLoading={loading} className="mt-2">
                        Đăng nhập
                    </Button>
                </form>

                {/* Tách khỏi form bằng đường viền: đây là hành động khác hẳn (tạo tài khoản mới),
                    không phải một bước của việc đăng nhập. */}
                <p className="text-sm text-text-muted pt-6 border-t border-border">
                    Chưa có tài khoản?{' '}
                    <Link to="/register" className="font-medium text-primary hover:text-primary-hover hover:underline rounded-sm">
                        Đăng ký
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
