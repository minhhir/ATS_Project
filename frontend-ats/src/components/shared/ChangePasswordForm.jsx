import { useState, useId } from 'react';
import { Button } from '@/ui/Button';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/api/axios';

export function ChangePasswordForm() {
    // Vấn đề: ba <label> không có htmlFor và ba <input> không có id, nên click nhãn không focus
    // vào ô, và screen reader đọc ra ba ô mật khẩu không tên — người dùng không biết ô nào là
    // "mật khẩu hiện tại", ô nào là "mật khẩu mới".
    // Giải pháp: useId sinh id ổn định qua các lần render, cùng cách src/ui/Input.jsx đang dùng.
    // Cần prefix riêng cho từng ô vì form này xuất hiện ở cả trang settings của admin lẫn HR.
    const fieldId = useId();
    const currentId = `${fieldId}-current`;
    const newId = `${fieldId}-new`;
    const confirmId = `${fieldId}-confirm`;
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', msg: '' });

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    // Vấn đề: Để backend tự báo "mật khẩu xác nhận sai" sẽ tốn 1 round-trip không cần thiết và lộ rằng user đã gõ sai sau khi load.
    // Giải pháp: Validate confirmPassword ngay phía client trước khi gọi API, đồng thời reset status cũ để tránh flash message lẫn lộn.
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', msg: '' });

        if (passwords.newPassword !== passwords.confirmPassword) {
            return setStatus({ type: 'error', msg: 'Mật khẩu xác nhận không khớp!' });
        }

        setLoading(true);
        try {
            await api.put('/auth/change-password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            setStatus({ type: 'success', msg: 'Đổi mật khẩu thành công!' });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setStatus({
                type: 'error',
                msg: error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.'
            });
        } finally {
            setLoading(false);
            setTimeout(() => setStatus({ type: '', msg: '' }), 5000);
        }
    };

    // Card tĩnh: viền 1px, bo 8px, không shadow.
    return (
        <div className="bg-surface-raised rounded-lg p-6 sm:p-8 border border-border">
            <h3 className="text-xl font-bold text-text-main mb-6 border-b border-border pb-4 flex items-center gap-2">
                <Lock size={20} className="text-primary" /> Bảo mật & Mật khẩu
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                <div>
                    <label htmlFor={currentId} className="block text-sm font-semibold text-text-main mb-1.5">Mật khẩu hiện tại</label>
                    <input
                        id={currentId}
                        type="password"
                        name="currentPassword"
                        value={passwords.currentPassword}
                        onChange={handleChange}
                        required
                        className="w-full h-11 px-3 rounded-sm border border-border bg-white text-sm text-text-main outline-none transition-colors hover:border-border-strong focus:border-primary focus:ring-2 focus:ring-primary/25"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor={newId} className="block text-sm font-semibold text-text-main mb-1.5">Mật khẩu mới</label>
                        <input
                            id={newId}
                            type="password"
                            name="newPassword"
                            value={passwords.newPassword}
                            onChange={handleChange}
                            required
                            className="w-full h-11 px-3 rounded-sm border border-border bg-white text-sm text-text-main outline-none transition-colors hover:border-border-strong focus:border-primary focus:ring-2 focus:ring-primary/25"
                        />
                    </div>
                    <div>
                        <label htmlFor={confirmId} className="block text-sm font-semibold text-text-main mb-1.5">Xác nhận mật khẩu</label>
                        <input
                            id={confirmId}
                            type="password"
                            name="confirmPassword"
                            value={passwords.confirmPassword}
                            onChange={handleChange}
                            required
                            className="w-full h-11 px-3 rounded-sm border border-border bg-white text-sm text-text-main outline-none transition-colors hover:border-border-strong focus:border-primary focus:ring-2 focus:ring-primary/25"
                        />
                    </div>
                </div>

                {/* role="alert": đổi mật khẩu là thao tác không có phản hồi nào khác ngoài dòng chữ này.
                    Không có role thì screen reader im lặng và người dùng không biết đã đổi được hay chưa. */}
                {status.msg && (
                    <div
                        role="alert"
                        className={`p-3 rounded-sm border flex items-start gap-2.5 text-sm animate-in fade-in ${status.type === 'success' ? 'border-success-100 bg-success-50 text-success-700' : 'border-danger-100 bg-danger-50 text-danger-700'
                            }`}
                    >
                        {status.type === 'success'
                            ? <CheckCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
                            : <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />}
                        {status.msg}
                    </div>
                )}

                <div className="pt-2">
                    <Button type="submit" isLoading={loading} className="px-8">
                        Cập nhật mật khẩu
                    </Button>
                </div>
            </form>
        </div>
    );
}