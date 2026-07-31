import { AdminLayout } from '@/layout/AdminLayout';
import { ChangePasswordForm } from '@/components/shared/ChangePasswordForm';
import { ShieldAlert } from 'lucide-react';

// Vấn đề: Admin không có hồ sơ công ty hay CV để chỉnh, chỉ cần đổi password; nhưng cần nhắc admin về đặc quyền cao trước khi cho thao tác.
// Giải pháp: Page tối giản chỉ chứa banner cảnh báo + ChangePasswordForm dùng chung, không lặp lại UI giống candidate/HR.
export function AdminSettingsPage() {
    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="page-title">Cài đặt hệ thống</h1>
                <p className="page-subtitle">Đổi mật khẩu tài khoản quản trị viên.</p>
            </div>

            <div className="space-y-8 max-w-3xl">
                {/* Thông báo quyền lực */}
                {/* Token đặc thay cho opacity: bg-danger/10 phụ thuộc vào nền phía sau nên tương phản
                    của chữ đặt lên không đoán trước được. Đây cũng là bộ class Badge.jsx và
                    candidate/SettingsPage.jsx đang dùng cho khối cảnh báo. */}
                <div className="bg-danger-50 border border-danger-100 rounded-lg p-5 flex gap-3">
                    {/* Icon thu về 20px cho ngang tầm chữ nó đứng cạnh — 32px làm hình to hơn tiêu đề. */}
                    <ShieldAlert size={20} className="text-danger-700 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                        <h3 className="text-base font-semibold text-danger-700">Tài khoản có đặc quyền cao nhất</h3>
                        {/* danger/80 chỉ đạt 4.08:1 trên nền danger/10. Opacity chồng opacity làm tương phản
                            không đoán được — dùng token đặc danger-700 (5.45:1) thay vì hạ độ mờ. */}
                        <p className="text-sm text-danger-700 mt-1 leading-relaxed">Xóa một nhà tuyển dụng sẽ xóa theo toàn bộ tin tuyển dụng và đơn ứng tuyển thuộc về họ. Thao tác này không khôi phục được.</p>
                    </div>
                </div>

                {/* Form đổi mật khẩu dùng chung */}
                <ChangePasswordForm />
            </div>
        </AdminLayout>
    );
}