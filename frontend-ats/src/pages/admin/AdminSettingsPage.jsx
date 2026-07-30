import { AdminLayout } from '@/layout/AdminLayout';
import { ChangePasswordForm } from '@/components/shared/ChangePasswordForm';
import { ShieldAlert } from 'lucide-react';

// Vấn đề: Admin không có hồ sơ công ty hay CV để chỉnh, chỉ cần đổi password; nhưng cần nhắc admin về đặc quyền cao trước khi cho thao tác.
// Giải pháp: Page tối giản chỉ chứa banner cảnh báo + ChangePasswordForm dùng chung, không lặp lại UI giống candidate/HR.
export function AdminSettingsPage() {
    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-black text-text-main">Cài đặt hệ thống</h1>
                <p className="text-text-muted mt-1 font-medium">Cấu hình tài khoản Quản trị viên.</p>
            </div>

            <div className="space-y-8 max-w-3xl">
                {/* Thông báo quyền lực */}
                <div className="bg-danger/10 border border-danger/20 rounded-3xl p-6 flex gap-4">
                    <ShieldAlert size={32} className="text-danger shrink-0" />
                    <div>
                        <h3 className="text-lg font-black text-danger">Tài khoản có đặc quyền cao nhất</h3>
                        <p className="text-sm text-danger/80 mt-1 font-medium">Bạn đang đăng nhập dưới tư cách Super Admin. Hãy cẩn trọng khi thực hiện các thao tác Xóa người dùng hoặc Việc làm vì dữ liệu không thể khôi phục.</p>
                    </div>
                </div>

                {/* Form đổi mật khẩu dùng chung */}
                <ChangePasswordForm />
            </div>
        </AdminLayout>
    );
}