import { useState, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { InputField } from '../../ui/InputField';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import api from '../../api/axios';

// ── Password strength calculator ─────────────────────────────────────────────
function getStrength(pw) {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { score, label: 'Yếu', color: 'bg-red-500', text: 'text-red-500' };
    if (score <= 2) return { score, label: 'Trung bình', color: 'bg-amber-500', text: 'text-amber-500' };
    if (score <= 3) return { score, label: 'Khá', color: 'bg-blue-500', text: 'text-blue-500' };
    return { score, label: 'Mạnh', color: 'bg-green-500', text: 'text-green-500' };
}

export function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';
    const otp = location.state?.otp || '';

    const [form, setForm] = useState({ password: '', confirmPassword: '' });
    const [showPw, setShowPw] = useState(false);
    const [showCfPw, setShowCfPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const strength = useMemo(() => getStrength(form.password), [form.password]);
    const mismatch = form.confirmPassword && form.password !== form.confirmPassword;

    const handleChange = (e) => {
        setError('');
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 6) { setError('Mật khẩu phải ít nhất 6 ký tự.'); return; }
        if (form.password !== form.confirmPassword) { setError('Mật khẩu nhập lại không khớp.'); return; }
        if (!email || !otp) { setError('Phiên làm việc hết hạn. Vui lòng thử lại.'); return; }

        setLoading(true);
        setError('');

        try {
            await api.post('/auth/reset-password', { email, otp, newPassword: form.password });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── Success state ──────────────────────────────────────────────────────────
    if (success) {
        return (
            <AuthLayout variant="orange">
                <div className="p-8 font-auth flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-5xl">check_circle</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                        Đặt lại mật khẩu thành công!
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                        Mật khẩu của bạn đã được cập nhật. Đang chuyển hướng về trang đăng nhập...
                    </p>
                    <Link
                        to="/login"
                        className="btn-auth"
                        style={{ background: '#ec5b13' }}
                    >
                        Đăng nhập ngay
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout variant="orange" showBackToLogin>
            <div className="p-8 font-auth">
                {/* Header */}
                <div className="mb-7">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        Đặt mật khẩu mới
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Tạo mật khẩu mạnh mà bạn chưa dùng trước đây.
                    </p>
                </div>

                {error && (
                    <div className="mb-5 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 text-red-600 dark:text-red-400 text-sm">
                        <span className="material-symbols-outlined text-lg flex-shrink-0">error</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    {/* New Password */}
                    <div className="space-y-2">
                        <InputField
                            id="password" name="password"
                            type={showPw ? 'text' : 'password'}
                            label="Mật khẩu mới"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            autoFocus
                            rightElement={
                                <button type="button" onClick={() => setShowPw(v => !v)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" tabIndex={-1}>
                                    <span className="material-symbols-outlined text-xl">
                                        {showPw ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            }
                        />

                        {/* Strength indicator */}
                        {form.password && (
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                                        Độ mạnh mật khẩu
                                    </span>
                                    <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
                                        style={{ width: `${(strength.score / 5) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <InputField
                        id="confirmPassword" name="confirmPassword"
                        type={showCfPw ? 'text' : 'password'}
                        label="Nhập lại mật khẩu"
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        error={mismatch ? 'Mật khẩu không khớp' : ''}
                        rightElement={
                            <button type="button" onClick={() => setShowCfPw(v => !v)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" tabIndex={-1}>
                                <span className="material-symbols-outlined text-xl">
                                    {showCfPw ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        }
                    />

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading || mismatch}
                        className="
              w-full flex items-center justify-center gap-2 mt-2
              disabled:opacity-60 disabled:cursor-not-allowed
              text-white font-bold py-3.5 rounded-xl transition-all
            "
                        style={{ background: loading || mismatch ? undefined : '#ec5b13' }}
                    >
                        {loading ? (
                            <><LoadingSpinner size="sm" color="white" /><span>Đang cập nhật...</span></>
                        ) : (
                            'Đặt lại mật khẩu'
                        )}
                    </button>
                </form>
            </div>
        </AuthLayout>
    );
}