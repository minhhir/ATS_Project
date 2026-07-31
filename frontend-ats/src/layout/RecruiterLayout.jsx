import { LayoutDashboard, Briefcase, Users, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DashboardShell } from '@/layout/DashboardShell';

// Vấn đề: Recruiter có 4 trang chính (dashboard/jobs/candidates/settings), copy sidebar mỗi trang sẽ vỡ tính nhất quán.
// Giải pháp: Khai báo menu + khối user của HR rồi giao toàn bộ phần khung cho DashboardShell dùng chung với Candidate/Admin.
const navItems = [
    { name: 'Tổng quan', path: '/recruiter/dashboard', icon: LayoutDashboard },
    { name: 'Quản lý tin', path: '/recruiter/jobs', icon: Briefcase },
    { name: 'Ứng viên', path: '/recruiter/candidates', icon: Users },
    { name: 'Cài đặt', path: '/recruiter/settings', icon: Settings },
];

export function RecruiterLayout({ children }) {
    const { user, logout } = useAuth();

    return (
        // Mật độ dày: HR quét danh sách ứng viên và tin tuyển dụng theo hàng chục dòng mỗi lượt.
        // Mỗi pixel dọc tiết kiệm được là thêm một dòng thấy mà không phải cuộn.
        <DashboardShell
            navItems={navItems}
            sectionLabel="Menu tuyển dụng"
            onLogout={logout}
            density="compact"
            contentClassName="max-w-6xl"
            userSlot={
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-9 h-9 rounded-full border border-border bg-surface flex items-center justify-center overflow-hidden text-primary text-sm font-bold shrink-0">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            user?.name?.charAt(0)?.toUpperCase() || 'H'
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-text-main truncate">{user?.name || 'Recruiter'}</div>
                        <div className="text-xs text-text-muted truncate">{user?.companyName || 'Công ty'}</div>
                    </div>
                </div>
            }
        >
            {children}
        </DashboardShell>
    );
}
