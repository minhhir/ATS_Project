import { Link } from 'react-router-dom';
import { LogOut, User, Briefcase } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/ui/Logo';
import { NotificationBell } from '@/components/shared/NotificationBell';

export function CandidateLayout({ children }) {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-surface flex flex-col font-sans">
            {/* Navbar */}
            <header className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

                    {/* Logo */}
                    <Logo />

                    {/* Main Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/jobs" className="text-primary font-bold flex items-center gap-2">
                            <Briefcase size={18} />
                            Việc làm
                        </Link>
                        <Link to="/applications" className="text-text-muted hover:text-primary font-semibold transition-colors">
                            Đơn đã nộp
                        </Link>
                    </nav>

                    {/* User Menu */}
                    <div className="flex items-center gap-4">
                        <Link to="/settings" className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary-light/50 rounded-full hover:bg-primary-light transition-colors cursor-pointer">
                            <User size={16} className="text-primary" />
                            <span className="text-sm font-bold text-primary">{user?.name || 'Ứng viên'}</span>
                        </Link>

                        {/* ✅ XÓA CÁI LINK TĨNH CŨ ĐI, THAY BẰNG COMPONENT CHUÔNG REAL-TIME NÀY */}
                        <NotificationBell />

                        <button
                            onClick={logout}
                            className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                            title="Đăng xuất"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-border py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-text-muted text-sm font-medium">
                    © 2026 Mini ATS Inc. Nền tảng tuyển dụng thông minh.
                </div>
            </footer>
        </div>
    );
}