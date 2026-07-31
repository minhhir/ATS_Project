import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/ui/Button';
import { AuthLayout } from '@/layout/AuthLayout';
import api from '@/api/axios';

export function OTPVerify() {
    const navigate = useNavigate();
    const location = useLocation();
    // Vấn đề: User truy cập trực tiếp /verify-otp không qua /forgot-password sẽ làm location.state=null gây crash.
    // Giải pháp: Optional chaining + fallback string để không throw khi state thiếu.
    const email = (location.state && location.state.email) ? location.state.email : 'email@cuaban.com';

    const [digits, setDigits] = useState(Array(6).fill(''));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendCd, setResendCd] = useState(60);
    const inputRefs = useRef([]);

    // Vấn đề: Cần đếm ngược 60s trước khi cho gửi lại OTP để tránh spam email; setInterval khó cleanup chính xác khi state đổi nhanh.
    // Giải pháp: setTimeout decrement mỗi giây và clearTimeout khi unmount/re-render — đơn giản và idempotent.
    useEffect(() => {
        if (resendCd > 0) {
            const timer = setTimeout(() => setResendCd(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCd]);
    // Vấn đề: Auto-submit khi điền đủ 6 số có thể bị trigger 2 lần do React batch state, gây gọi /verify-otp đôi.
    // Giải pháp: Cờ ref isSubmitting tracking ngoài render cycle, chỉ reset khi promise xong.
    const isSubmitting = useRef(false);

    // Vấn đề: handleVerify dùng digits/email từ closure, nếu pass thẳng vào useEffect có thể bị stale (digits cũ).
    // Giải pháp: Bọc useCallback với deps [digits, email, navigate] để mỗi lần digits đổi, callback mới có data đúng.
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

    // Vấn đề: User thường paste cả OTP từ email vào ô đầu tiên; nếu chỉ xử lý từng ký tự sẽ chỉ ghi 1 số đầu, mất phần còn lại.
    // Giải pháp: Detect val.length > 1 nghĩa là paste, chia chars vào nhiều ô liên tiếp, focus ô tiếp theo sau khi paste xong.
    const handleChange = (idx, val) => {
        if (val.length > 1) {
            const chars = val.replace(/\D/g, '').slice(0, 6).split('');
            const next = [...digits];
            chars.forEach((c, i) => { if (idx + i < 6) next[idx + i] = c; });
            setDigits(next);
            const nextIdx = Math.min(idx + chars.length, 5);
            if (inputRefs.current[nextIdx]) inputRefs.current[nextIdx].focus();
            return;
        }

        // Vấn đề: User có thể gõ chữ vào ô số làm OTP sai format trước khi submit.
        // Giải pháp: Regex /^\d*$/ chặn ngay tại keystroke, val rỗng vẫn cho qua để hỗ trợ Backspace.
        if (!/^\d*$/.test(val)) return;
        const next = [...digits];
        next[idx] = val;
        setDigits(next);
        if (val && idx < 5 && inputRefs.current[idx + 1]) {
            inputRefs.current[idx + 1].focus();
        }
    };

    // Vấn đề: Khi ô đang trống và user nhấn Backspace, browser không tự nhảy về ô trước khiến UX kẹt.
    // Giải pháp: Listen keydown, nếu Backspace + ô đang rỗng thì focus về ô liền trước để xoá tiếp.
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
            <div className="space-y-8">
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors rounded-sm"
                >
                    <ArrowLeft size={16} aria-hidden="true" /> Quay lại đăng nhập
                </Link>

                <div>
                    <h1 className="text-2xl font-semibold text-text-main">Nhập mã xác nhận</h1>
                    <p className="text-sm text-text-muted mt-2">
                        Chúng tôi đã gửi mã 6 số tới{' '}
                        <span className="font-medium text-text-main">{email}</span>
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                    {error && (
                        <div
                            role="alert"
                            className="flex items-start gap-2.5 p-3 rounded-sm border border-danger-100 bg-danger-50 text-sm text-danger-700"
                        >
                            <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Vấn đề: 6 ô input rời không có nhãn nào — screen reader đọc thành sáu ô
                        "edit text" trống hệt nhau, người dùng không biết mình đang ở ô thứ mấy
                        trong tổng số mấy.
                        Giải pháp: role="group" kèm nhãn chung cho cả khối, và mỗi ô có aria-label
                        nói rõ vị trí. autoComplete="one-time-code" ở ô đầu để iOS/Android gợi ý
                        mã vừa nhận được. */}
                    <div role="group" aria-labelledby="otp-group-label">
                        <span id="otp-group-label" className="block text-sm font-semibold text-text-main mb-2">
                            Mã xác nhận 6 số
                        </span>
                        <div className="flex gap-2">
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
                                    aria-label={`Số thứ ${idx + 1} trong 6 số`}
                                    autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                                    // Bo 4px cùng bậc với mọi ô nhập khác. Chữ 20px semibold:
                                    // đủ lớn để đọc lại mã vừa gõ, không cần tới cỡ display.
                                    className="w-full h-12 min-w-0 text-center text-lg font-semibold rounded-sm border border-border bg-white text-text-main transition-colors duration-200 ease-smooth hover:border-border-strong focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                                />
                            ))}
                        </div>
                    </div>

                    <Button type="submit" fullWidth isLoading={loading}>
                        Xác nhận
                    </Button>
                </form>

                <p className="text-sm text-text-muted pt-6 border-t border-border">
                    Chưa nhận được mã?{' '}
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendCd > 0}
                        aria-disabled={resendCd > 0 || undefined}
                        className="font-medium text-primary transition-colors cursor-pointer rounded-sm hover:text-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:text-text-subtle disabled:cursor-not-allowed disabled:no-underline"
                    >
                        {resendCd > 0 ? `Gửi lại sau ${resendCd}s` : 'Gửi lại ngay'}
                    </button>
                </p>
            </div>
        </AuthLayout>
    );
}
