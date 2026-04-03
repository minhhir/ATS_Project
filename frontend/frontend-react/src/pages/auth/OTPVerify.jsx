import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import api from '../../api/axios';

const OTP_LENGTH = 6;

export function OTPVerify() {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCd, setResendCd] = useState(60); // countdown giây
    const inputRefs = useRef([]);

    // Countdown resend
    useEffect(() => {
        if (resendCd <= 0) return;
        const t = setTimeout(() => setResendCd(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCd]);

    const handleChange = (idx, val) => {
        // Chấp nhận paste chuỗi 6 số
        if (val.length > 1) {
            const chars = val.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
            const next = [...digits];
            chars.forEach((c, i) => { if (idx + i < OTP_LENGTH) next[idx + i] = c; });
            setDigits(next);
            const nextIdx = Math.min(idx + chars.length, OTP_LENGTH - 1);
            inputRefs.current[nextIdx]?.focus();
            return;
        }

        if (!/^\d*$/.test(val)) return; // chỉ nhận số
        const next = [...digits];
        next[idx] = val;
        setDigits(next);
        setError('');

        if (val && idx < OTP_LENGTH - 1) {
            inputRefs.current[idx + 1]?.focus();
        }
    };

    const handleKeyDown = (idx, e) => {
        if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
            inputRefs.current[idx - 1]?.focus();
        }
    };

    // Auto-submit khi đủ 6 số
    useEffect(() => {
        if (digits.every(d => d !== '')) {
            handleVerify();
        }
    }, [digits]);

    const handleVerify = async () => {
        const otp = digits.join('');
        if (otp.length < OTP_LENGTH) {
            setError('Vui lòng nhập đủ 6 số.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/auth/verify-otp', { email, otp });
            navigate('/reset-password', { state: { email, otp } });
        } catch (err) {
            const msg = err?.response?.data?.message || 'Mã không đúng. Vui lòng thử lại.';
            setError(msg);
            setDigits(Array(OTP_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCd > 0) return;
        try {
            await api.post('/auth/forgot-password', { email });
            setResendCd(60);
            setError('');
            setDigits(Array(OTP_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        } catch { }
    };

    return (
        <AuthLayout variant="orange" showBackToLogin>
            <div className="p-8 font-auth">
                {/* Icon + Header */}
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-auth/10 dark:bg-auth/20 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-auth text-4xl">mail</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        Kiểm tra email của bạn
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        Chúng tôi đã gửi mã 6 chữ số đến
                        {email && (
                            <span className="block font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                                {email}
                            </span>
                        )}
                    </p>
                </div>

                {/* OTP inputs */}
                <div className="flex justify-center gap-2 sm:gap-3 mb-6">
                    {digits.map((digit, idx) => (
                        <input
                            key={idx}
                            ref={el => inputRefs.current[idx] = el}
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={digit}
                            onChange={e => handleChange(idx, e.target.value)}
                            onKeyDown={e => handleKeyDown(idx, e)}
                            onFocus={e => e.target.select()}
                            className={`
                w-11 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold
                bg-slate-50 dark:bg-slate-800 rounded-lg transition-all
                focus:outline-none focus:ring-2
                ${error
                                    ? 'border-2 border-red-400 focus:ring-red-400/30'
                                    : 'border-2 border-slate-200 dark:border-slate-700 focus:ring-auth/30 focus:border-auth'
                                }
                ${digit ? 'text-auth dark:text-orange-400 border-auth/50 dark:border-orange-500/50' : 'text-slate-900 dark:text-slate-100'}
              `}
                        />
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <p className="flex items-center justify-center gap-1 text-sm text-red-500 dark:text-red-400 mb-4">
                        <span className="material-symbols-outlined text-sm">error</span>
                        {error}
                    </p>
                )}

                {/* Verify button */}
                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={handleVerify}
                        disabled={loading || digits.some(d => !d)}
                        className="
              w-full flex items-center justify-center gap-2
              bg-auth hover:bg-auth-hover disabled:opacity-60 disabled:cursor-not-allowed
              text-white font-bold py-3.5 rounded-xl transition-all
            "
                    >
                        {loading ? (
                            <><LoadingSpinner size="sm" color="white" /><span>Đang xác minh...</span></>
                        ) : (
                            'Xác minh & Tiếp tục'
                        )}
                    </button>

                    {/* Resend */}
                    <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                        Chưa nhận được mã?{' '}
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={resendCd > 0}
                            className={`font-semibold transition-colors ${resendCd > 0
                                    ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                    : 'text-auth hover:underline'
                                }`}
                        >
                            {resendCd > 0 ? `Gửi lại (${resendCd}s)` : 'Gửi lại mã'}
                        </button>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}