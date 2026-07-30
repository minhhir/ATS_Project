import { useState } from 'react';
import { Button } from '@/ui/Button';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/api/axios';

export function ChangePasswordForm() {
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

    return (
        <div className="bg-white rounded-3xl p-8 border border-border shadow-sm">
            <h3 className="text-xl font-bold text-text-main mb-6 border-b border-border pb-4 flex items-center gap-2">
                <Lock size={20} className="text-primary" /> Bảo mật & Mật khẩu
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                <div>
                    <label className="block text-sm font-bold mb-2">Mật khẩu hiện tại</label>
                    <input
                        type="password"
                        name="currentPassword"
                        value={passwords.currentPassword}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 bg-surface font-medium"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold mb-2">Mật khẩu mới</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={passwords.newPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 bg-surface font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Xác nhận mật khẩu</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={passwords.confirmPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 bg-surface font-medium"
                        />
                    </div>
                </div>

                {status.msg && (
                    <div className={`p-4 rounded-xl flex items-center gap-2 text-sm font-bold animate-in fade-in zoom-in ${status.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                        }`}>
                        {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
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