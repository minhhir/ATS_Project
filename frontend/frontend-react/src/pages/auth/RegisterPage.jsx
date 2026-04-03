import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { InputField } from '../../ui/InputField';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

// ── Validation helpers ────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2)
        errs.name = 'Họ tên phải từ 2 ký tự trở lên.';
    if (!EMAIL_RE.test(form.email))
        errs.email = 'Email không đúng định dạng.';
    if (form.password.length < 6)
        errs.password = 'Mật khẩu phải ít nhất 6 ký tự.';
    if (form.password !== form.confirmPassword)
        errs.confirmPassword = 'Mật khẩu nhập lại không khớp.';
    if (form.role === 'recruiter' && !form.companyName.trim())
        errs.companyName = 'Vui lòng nhập tên công ty.';
    return errs;
}

export function RegisterPage() {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        role: 'candidate', companyName: '',
    });
    const [showPw, setShowPw] = useState(false);
    const [showCfPw, setShowCfPw] = useState(false);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setErrors(prev => ({ ...prev, [name]: '' }));
        setApiError('');
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const setRole = (role) => {
        setErrors({});
        setForm(prev => ({ ...prev, role, companyName: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate(form);
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        setLoading(true);
        setApiError('');

        try {
            const payload = {
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                password: form.password,
                role: form.role,
                ...(form.role === 'recruiter' && { companyName: form.companyName.trim() }),
            };
            const user = await register(payload);
            const roleHome = { candidate: '/jobs', recruiter: '/recruiter/dashboard' };
            navigate(roleHome[user.role] || '/', { replace: true });
        } catch (err) {
            const msg = err?.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
            setApiError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout variant="blue">
            <div className="p-8">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mb-1">
                        Tạo tài khoản
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Tham gia hệ thống tuyển dụng thông minh nhất.
                    </p>
                </div>

                {/* Role switcher */}
                <div className="mb-6">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tôi là:</p>
                    <div className="flex h-12 w-full items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-1 gap-1">
                        {[
                            { value: 'candidate', label: 'Ứng viên' },
                            { value: 'recruiter', label: 'Nhà tuyển dụng' },
                        ].map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setRole(value)}
                                className={`
                  flex-1 h-full rounded-md text-sm font-medium transition-all
                  ${form.role === value
                                        ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }
                `}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* API error */}
                {apiError && (
                    <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm">
                        <span className="material-symbols-outlined text-lg flex-shrink-0">error</span>
                        {apiError}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    {/* Name */}
                    <InputField
                        id="name" name="name" label="Họ và tên"
                        placeholder="Nguyễn Văn A" value={form.name}
                        onChange={handleChange} icon="person" error={errors.name}
                        autoFocus
                    />

                    {/* Email */}
                    <InputField
                        id="email" name="email" type="email" label="Email"
                        placeholder="example@email.com" value={form.email}
                        onChange={handleChange} icon="mail" error={errors.email}
                    />

                    {/* Company — chỉ hiển thị khi là recruiter */}
                    {form.role === 'recruiter' && (
                        <div className="animate-fade-up">
                            <InputField
                                id="companyName" name="companyName" label="Tên công ty"
                                placeholder="Công ty ABC" value={form.companyName}
                                onChange={handleChange} icon="business" error={errors.companyName}
                            />
                        </div>
                    )}

                    {/* Password row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField
                            id="password" name="password" type={showPw ? 'text' : 'password'}
                            label="Mật khẩu" placeholder="••••••••" value={form.password}
                            onChange={handleChange} error={errors.password}
                            rightElement={
                                <button type="button" onClick={() => setShowPw(v => !v)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" tabIndex={-1}>
                                    <span className="material-symbols-outlined text-xl">
                                        {showPw ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            }
                        />
                        <InputField
                            id="confirmPassword" name="confirmPassword"
                            type={showCfPw ? 'text' : 'password'}
                            label="Nhập lại" placeholder="••••••••" value={form.confirmPassword}
                            onChange={handleChange} error={errors.confirmPassword}
                            rightElement={
                                <button type="button" onClick={() => setShowCfPw(v => !v)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" tabIndex={-1}>
                                    <span className="material-symbols-outlined text-xl">
                                        {showCfPw ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            }
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="
              w-full flex items-center justify-center gap-2 mt-2
              bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed
              text-white font-bold py-3 rounded-xl transition-all
              shadow-primary-sm hover:shadow-primary-md hover:scale-[1.01] active:scale-[.99]
            "
                    >
                        {loading ? (
                            <><LoadingSpinner size="sm" color="white" /><span>Đang tạo tài khoản...</span></>
                        ) : (
                            <><span>Tạo tài khoản</span><span className="material-symbols-outlined text-lg">arrow_forward</span></>
                        )}
                    </button>

                    <p className="text-center text-xs text-slate-400 dark:text-slate-500 pt-1">
                        Bằng cách đăng ký, bạn đồng ý với{' '}
                        <Link to="#" className="underline hover:text-primary">Điều khoản dịch vụ</Link>
                        {' '}và{' '}
                        <Link to="#" className="underline hover:text-primary">Chính sách bảo mật</Link>.
                    </p>
                </form>

                {/* Footer */}
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="text-primary font-semibold hover:underline">
                            Đăng nhập
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}