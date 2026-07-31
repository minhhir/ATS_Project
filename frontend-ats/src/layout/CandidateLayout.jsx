import { Search, FileText, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DashboardShell } from '@/layout/DashboardShell';

// Vấn đề: Mỗi trang candidate cần lặp lại sidebar/header, copy-paste sẽ rất khó bảo trì khi đổi menu.
// Giải pháp: Chỉ khai báo phần riêng của ứng viên; khung sidebar/drawer/header nằm chung ở DashboardShell.
const navItems = [
    { name: 'Tìm việc làm', path: '/candidate/jobs', icon: Search },
    { name: 'Đơn ứng tuyển', path: '/candidate/applications', icon: FileText },
    { name: 'Cài đặt', path: '/candidate/settings', icon: Settings },
];

export function CandidateLayout({ children }) {
    const { user, logout } = useAuth();

    return (
        // Mật độ vừa + nội dung hẹp hơn HR: ứng viên đọc mô tả công việc, tức là đọc văn xuôi.
        // Dòng chữ quá dài thì mắt mất điểm bắt đầu khi xuống dòng, nên giới hạn bề rộng.
        <DashboardShell
            navItems={navItems}
            sectionLabel="Dành cho ứng viên"
            onLogout={logout}
            density="default"
            contentClassName="max-w-5xl"
            userSlot={
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-9 h-9 rounded-full border border-border bg-surface flex items-center justify-center overflow-hidden text-primary text-sm font-bold shrink-0">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            user?.name?.charAt(0)?.toUpperCase() || 'U'
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-text-main truncate">{user?.name || 'Ứng viên'}</div>
                        <div className="text-xs text-text-muted truncate">{user?.email || 'Tài khoản'}</div>
                    </div>
                </div>
            }
        >
            {children}
        </DashboardShell>
    );
}
