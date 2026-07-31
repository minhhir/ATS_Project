import { LayoutDashboard, Users, Briefcase, Settings, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DashboardShell } from '@/layout/DashboardShell';

// Vấn đề: Admin cần phân biệt rõ với khu vực HR/ứng viên để giảm rủi ro thao tác nhầm trên dữ liệu toàn hệ thống.
// Giải pháp: Dùng chung khung DashboardShell nhưng gắn badge SUPER ADMIN và tắt chuông thông báo để giảm nhiễu.
const navItems = [
    { name: 'Tổng quan', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Người dùng', path: '/admin/users', icon: Users },
    { name: 'Việc làm & Tin', path: '/admin/jobs', icon: Briefcase },
    { name: 'Cài đặt hệ thống', path: '/admin/settings', icon: Settings },
];

export function AdminLayout({ children }) {
    const { user, logout } = useAuth();

    return (
        <DashboardShell
            navItems={navItems}
            sectionLabel="Quản trị viên"
            onLogout={logout}
            showNotifications={false}
            // Dày nhất và rộng nhất: bảng quản trị người dùng/tin tuyển dụng có nhiều cột nhất
            // trong hệ thống. Đây cũng là điểm phân biệt admin với HR — bằng cấu trúc, không
            // bằng màu: cùng một accent, khác bề rộng và mật độ.
            density="compact"
            contentClassName="max-w-content"
            userSlot={
                // Dùng đúng khung avatar trung tính như Recruiter/Candidate (bg-surface + viền),
                // không phải chip icon nền tint màu — để ba khu vực nhìn cùng một hệ.
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-9 h-9 rounded-full border border-border bg-surface flex items-center justify-center text-text-muted shrink-0">
                        <ShieldCheck size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-text-main truncate">{user?.name || 'Admin'}</div>
                        <div className="text-xs font-semibold text-text-muted">Quản trị hệ thống</div>
                    </div>
                </div>
            }
        >
            {children}
        </DashboardShell>
    );
}
