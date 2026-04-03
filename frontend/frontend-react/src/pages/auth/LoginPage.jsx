import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { InputField } from '../../ui/InputField';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

// ── Redirect mỗi role về đúng trang home ─────────────────────────────────────
const ROLE_HOME = {
    candidate: '/jobs',
    recruiter: '/recruiter/dashboard',
    admin: '/admin/dashboard',
};

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // Lấy trang muốn vào trước khi bị redirect về login
    const from = location.state?.from?.pathname;

    const [activeTab, setActiveTab] = useState('candidate'); // tab UI only
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setError('');
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            setError('Vui lòng nhập đầy đủ email và mật khẩu.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const user = await login({ email: form.email, password: form.password });
            // Redirect: trang cũ → hoặc đúng home theo role
            navigate(from || ROLE_HOME[user.role] || '/', { replace: true });
        } catch (err) {
            const msg = err?.response?.data?.message || 'Email hoặc mật khẩu không đúng.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout variant="blue">
            {/* Tabs Candidate / Recruiter — UI only, backend dùng 1 endpoint */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
                {['candidate', 'recruiter'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
              flex-1 py-4 text-sm font-semibold border-b-2 transition-colors capitalize
              ${activeTab === tab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }
            `}
                    >
                        {tab === 'candidate' ? 'Ứng viên' : 'Nhà tuyển dụng'}
                    </button>
                ))}
            </div>

            <div className="p-8">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                        Chào mừng trở lại
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Nhập thông tin đăng nhập của bạn
                    </p>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="mb-5 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm">
                        <span className="material-symbols-outlined text-lg flex-shrink-0">error</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    {/* Email */}
                    <InputField
                        id="email"
                        name="email"
                        type="email"
                        label="Email"
                        placeholder="name@company.com"
                        value={form.email}
                        onChange={handleChange}
                        icon="mail"
                        autoComplete="email"
                        autoFocus
                    />

                    {/* Password */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Mật khẩu
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-xs font-semibold text-primary hover:underline"
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>
                        <InputField
                            id="password"
                            name="password"
                            type={showPw ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            icon="lock"
                            autoComplete="current-password"
                            rightElement={
                                <button
                                    type="button"
                                    onClick={() => setShowPw(v => !v)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                    tabIndex={-1}
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {showPw ? 'visibility_off' : 'visibility'}
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
                            <>
                                <LoadingSpinner size="sm" color="white" />
                                <span>Đang đăng nhập...</span>
                            </>
                        ) : (
                            'Đăng nhập'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Chưa có tài khoản?{' '}
                        <Link to="/register" className="text-primary font-semibold hover:underline">
                            Đăng ký ngay
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}