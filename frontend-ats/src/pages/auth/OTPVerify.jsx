import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/ui/Button';
import { AuthLayout } from '@/layout/AuthLayout';
import api from '@/api/axios';
import { ArrowLeft, Mail, AlertCircle } from 'lucide-react';

export function OTPVerify() {
    const navigate = useNavigate();
    const location = useLocation();
    // Bảo vệ an toàn: Kiểm tra kỹ location.state trước khi lấy email
    const email = (location.state && location.state.email) ? location.state.email : 'email@cuaban.com';

    const [digits, setDigits] = useState(Array(6).fill(''));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendCd, setResendCd] = useState(60);
    const inputRefs = useRef([]);

    // Countdown gửi lại mã
    useEffect(() => {
        if (resendCd > 0) {
            const timer = setTimeout(() => setResendCd(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCd]);
    const isSubmitting = useRef(false); // Ngăn submit nhiều lần

    // Hàm verify bọc trong useCallback để tránh stale closure
    const handleVerify = useCallback(async (e) => {
        if (e) e.preventDefault();
        const otp = digits.join('');
        if (otp.length < 6) return setError('Vui lòng nhập đủ 6 số');
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/verify-otp', { email, otp });
            navigate('/reset-password', { state: { email, otp } });
        } catch (err) {
            setError(err?.response?.data?.message || 'Mã xác nhận không hợp lệ.');
            setDigits(Array(6).fill(''));
            // An toàn: Kiểm tra ref có tồn tại không trước khi focus
            if (inputRefs.current[0]) inputRefs.current[0].focus();
        } finally {
            setLoading(false);
        }
    }, [digits, email, navigate]);

    // Auto-submit khi nhập đủ 6 số
    useEffect(() => {
        if (digits.every(d => d !== '' && /^\d$/.test(d)) && !isSubmitting.current) {
            isSubmitting.current = true;
            handleVerify().finally(() => { isSubmitting.current = false; });
        }
    }, [digits, handleVerify]);

    const handleChange = (idx, val) => {
        // Xử lý Paste
        if (val.length > 1) {
            const chars = val.replace(/\D/g, '').slice(0, 6).split('');
            const next = [...digits];
            chars.forEach((c, i) => { if (idx + i < 6) next[idx + i] = c; });
            setDigits(next);
            const nextIdx = Math.min(idx + chars.length, 5);
            if (inputRefs.current[nextIdx]) inputRefs.current[nextIdx].focus();
            return;
        }

        // Xử lý nhập từng số
        if (!/^\d*$/.test(val)) return;
        const next = [...digits];
        next[idx] = val;
        setDigits(next);
        if (val && idx < 5 && inputRefs.current[idx + 1]) {
            inputRefs.current[idx + 1].focus();
        }
    };

    const handleKeyDown = (idx, e) => {
        if (e.key === 'Backspace' && !digits[idx] && idx > 0 && inputRefs.current[idx - 1]) {
            inputRefs.current[idx - 1].focus();
        }
    };

    const handleResend = async () => {
        if (resendCd > 0) return;
        try {
            await api.post('/auth/forgot-password', { email });
            setResendCd(60);
            setError('');
        } catch (e) {
            console.error(e);
            setError('Lỗi khi gửi lại mã. Vui lòng thử lại sau.');
        }
    };

    return (
        <AuthLayout>
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-primary transition-colors">
                    <ArrowLeft size={16} /> Quay lại đăng nhập
                </Link>

                <div>
                    <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mb-6">
                        <Mail className="text-primary" size={24} />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-text-main">Kiểm tra email</h1>
                    <p className="text-text-muted mt-2 text-sm font-medium">Chúng tôi đã gửi mã xác nhận 6 số tới <span className="text-text-main font-bold">{email}</span></p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-sm font-medium">
                        <AlertCircle size={18} /><span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleVerify} className="space-y-6">
                    <div className="flex justify-between gap-2">
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
                                className="w-12 h-14 text-center text-xl font-extrabold border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white text-text-main"
                            />
                        ))}
                    </div>

                    <Button type="submit" className="w-full" isLoading={loading}>
                        Xác nhận
                    </Button>
                </form>

                <p className="text-center text-sm font-medium text-text-muted">
                    Chưa nhận được mã?{' '}
                    <button onClick={handleResend} disabled={resendCd > 0} className={`font-bold transition-colors ${resendCd > 0 ? 'text-text-muted cursor-not-allowed' : 'text-primary hover:text-primary-hover'}`}>
                        {resendCd > 0 ? `Gửi lại sau ${resendCd}s` : 'Gửi lại ngay'}
                    </button>
                </p>
            </div>
        </AuthLayout>
    );
}