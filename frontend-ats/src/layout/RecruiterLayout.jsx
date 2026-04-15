import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, Settings, LogOut, Menu, X, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/ui/Logo';

export function RecruiterLayout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const navItems = [
        { name: 'Tổng quan', path: '/recruiter/dashboard', icon: LayoutDashboard },
        { name: 'Quản lý tin', path: '/recruiter/jobs', icon: Briefcase },
        { name: 'Ứng viên', path: '/recruiter/candidates', icon: Users },
        { name: 'Cài đặt', path: '/recruiter/settings', icon: Settings },
    ];

    const SidebarContent = () => (
        <>
            <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                <Logo />
                <button onClick={() => setMobileOpen(false)} className="md:hidden text-text-muted hover:bg-surface p-1 rounded-lg">
                    <X size={20} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 px-2">Menu chính</div>
                {navItems.map((item) => {
                    const isActive = location.pathname.includes(item.path);
                    const Icon = item.icon;
                    return (
                        <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all ${isActive ? 'bg-primary-light/50 text-primary' : 'text-text-muted hover:bg-surface hover:text-text-main'}`}>
                            <Icon size={20} className={isActive ? 'text-primary' : 'text-text-muted'} />
                            {item.name}
                        </Link>
                    );
                })}
            </div>
            <div className="p-4 border-t border-border space-y-2">
                <div className="flex items-center gap-3 px-2 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold">{user?.name?.charAt(0) || 'HR'}</div>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-bold text-text-main truncate">{user?.name}</div>
                        <div className="text-xs text-text-muted truncate">{user?.companyName || 'Công ty'}</div>
                    </div>
                </div>
                <Link to="/notifications" className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-semibold text-text-muted hover:bg-surface hover:text-text-main rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                        <Bell size={18} /> Thông báo
                    </div>
                    <span className="w-2 h-2 bg-danger rounded-full"></span>
                </Link>

                <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10 rounded-lg transition-colors">
                    <LogOut size={18} /> Đăng xuất
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-surface flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border fixed h-full z-20">
                <SidebarContent />
            </aside>
            {mobileOpen && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
                    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-border z-40 md:hidden flex flex-col animate-in slide-in-from-left-full duration-200">
                        <SidebarContent />
                    </aside>
                </>
            )}

            {/* Main Content */}
            <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
                <header className="md:hidden h-16 bg-white border-b border-border flex items-center justify-between px-4 sticky top-0 z-20">
                    <Logo />
                    <button onClick={() => setMobileOpen(true)} className="p-2 text-text-muted hover:bg-surface rounded-lg">
                        <Menu size={24} />
                    </button>
                </header>
                <div className="flex-1 p-4 sm:p-8 w-full max-w-6xl mx-auto">{children}</div>
            </main>
        </div>
    );
}