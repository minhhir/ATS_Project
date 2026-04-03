import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { InputField } from '../../ui/InputField';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import api from '../../api/axios';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!EMAIL_RE.test(email)) {
            setError('Email không đúng định dạng.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Gọi API reset password — backend cần có endpoint này
            await api.post('/auth/forgot-password', { email });
            setSent(true);
            // Chuyển sang OTP page sau 1.5s
            setTimeout(() => navigate('/verify-otp', { state: { email } }), 1500);
        } catch (err) {
            // Không lộ thông tin "email có tồn tại không" — luôn hiện success
            // Chỉ hiện lỗi nếu là lỗi server thực sự (5xx)
            if (err?.response?.status >= 500) {
                setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
            } else {
                setSent(true);
                setTimeout(() => navigate('/verify-otp', { state: { email } }), 1500);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout variant="orange" showBackToLogin>
            <div className="p-8 font-auth">
                {/* Header */}
                <div className="mb-7">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        Quên mật khẩu?
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        Nhập email của bạn, chúng tôi sẽ gửi mã xác nhận để đặt lại mật khẩu.
                    </p>
                </div>

                {/* Sent success state */}
                {sent && (
                    <div className="mb-5 flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400 text-sm">
                        <span className="material-symbols-outlined text-lg flex-shrink-0">mark_email_read</span>
                        Đã gửi! Đang chuyển hướng đến trang nhập mã...
                    </div>
                )}

                {error && (
                    <div className="mb-5 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 text-red-600 dark:text-red-400 text-sm">
                        <span className="material-symbols-outlined text-lg flex-shrink-0">error</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <InputField
                        id="email" name="email" type="email"
                        label="Địa chỉ Email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => { setError(''); setEmail(e.target.value); }}
                        icon="mail"
                        error={error && !error.includes('lỗi') ? error : ''}
                        autoFocus
                        autoComplete="email"
                    />

                    <button
                        type="submit"
                        disabled={loading || sent}
                        className="
              w-full flex items-center justify-center gap-2
              bg-auth hover:bg-auth-hover disabled:opacity-60 disabled:cursor-not-allowed
              text-white font-bold py-3.5 rounded-lg transition-all
            "
                    >
                        {loading ? (
                            <><LoadingSpinner size="sm" color="white" /><span>Đang gửi...</span></>
                        ) : (
                            <><span>Gửi mã xác nhận</span><span className="material-symbols-outlined text-lg">send</span></>
                        )}
                    </button>
                </form>

                {/* Help */}
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Cần hỗ trợ?{' '}
                        <Link to="#" className="text-auth font-semibold hover:underline">
                            Liên hệ hỗ trợ
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}