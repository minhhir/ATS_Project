import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { AuthLayout } from '@/layout/AuthLayout';
import { useAuth } from '@/context/AuthContext';

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

    const roles = [
        { value: 'candidate', label: 'Tôi tìm việc' },
        { value: 'recruiter', label: 'Tôi tuyển người' },
    ];

    return (
        <AuthLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-semibold text-text-main">Tạo tài khoản</h1>
                    {/* Câu này giải thích lý do có nút chọn vai trò ngay bên dưới, thay cho một câu
                        quảng cáo chung chung — người dùng cần biết chọn sai thì vào sai khu vực. */}
                    <p className="text-sm text-text-muted mt-2">
                        Ứng viên và nhà tuyển dụng dùng hai khu vực khác nhau, nên hãy chọn đúng vai trò.
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

                    {/* Vấn đề: Hai nút chọn vai trò trước đây là <button> trơn — screen reader chỉ đọc
                        được nhãn, không biết cái nào đang được chọn.
                        Giải pháp: aria-pressed cho mẫu nút bật/tắt. Không dùng role="radio" vì radio
                        buộc phải tự xử lý điều hướng bằng phím mũi tên mới đúng chuẩn.
                        Trạng thái chọn phân biệt bằng NỀN TRẮNG + VIỀN, không bằng shadow. */}
                    <div className="grid grid-cols-2 gap-1 p-1 bg-surface-sunken rounded-lg border border-border">
                        {roles.map(({ value, label }) => {
                            const selected = form.role === value;
                            return (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setRole(value)}
                                    aria-pressed={selected}
                                    className={`h-9 rounded-sm text-sm transition-colors duration-200 ease-smooth cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                                        selected
                                            ? 'bg-white border border-border-strong text-text-main font-semibold'
                                            : 'text-text-muted font-medium hover:text-text-main'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <Input name="name" label="Họ và tên" placeholder="Nguyễn Văn A" value={form.name} onChange={handleChange} autoComplete="name" required />
                    <Input name="email" label="Email" type="email" placeholder="name@company.com" value={form.email} onChange={handleChange} autoComplete="email" required />

                    {form.role === 'recruiter' && (
                        // Fade 200ms: chuyển động ở đây có nghĩa — nó cho biết một trường vừa được
                        // thêm vào do lựa chọn phía trên, không phải trang tự nhảy.
                        <div className="animate-in fade-in duration-200">
                            <Input name="companyName" label="Tên công ty" placeholder="Công ty TNHH ABC" value={form.companyName} onChange={handleChange} autoComplete="organization" required />
                        </div>
                    )}

                    {/* Một cột trên mobile: hai ô mật khẩu cạnh nhau ở 375px thì nhãn "Xác nhận lại"
                        bị ngắt dòng và ô nhập chỉ còn khoảng 150px. */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input name="password" label="Mật khẩu" type="password" value={form.password} onChange={handleChange} autoComplete="new-password" required />
                        <Input name="confirmPassword" label="Nhập lại mật khẩu" type="password" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" required />
                    </div>

                    <Button type="submit" fullWidth isLoading={loading} className="mt-2">
                        Tạo tài khoản
                    </Button>
                </form>

                <p className="text-sm text-text-muted pt-6 border-t border-border">
                    Đã có tài khoản?{' '}
                    <Link to="/login" className="font-medium text-primary hover:text-primary-hover hover:underline rounded-sm">
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
