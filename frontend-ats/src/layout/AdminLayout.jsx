import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Settings, LogOut, Menu, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/ui/Logo';

export function AdminLayout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Các tính năng "độc quyền" của Admin
    const navItems = [
        { name: 'Tổng quan', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Người dùng', path: '/admin/users', icon: Users },
        { name: 'Việc làm & Tin', path: '/admin/jobs', icon: Briefcase },
        { name: 'Cài đặt hệ thống', path: '/admin/settings', icon: Settings },
    ];

    const sidebarContent = (
        <>
            <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                <Logo />
                <button onClick={() => setMobileOpen(false)} className="md:hidden text-text-muted hover:bg-surface p-1 rounded-lg">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 px-2">Quản trị viên</div>
                {navItems.map((item) => {
                    const isActive = location.pathname.includes(item.path);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all ${isActive ? 'bg-primary-light/50 text-primary' : 'text-text-muted hover:bg-surface hover:text-text-main'}`}
                        >
                            <Icon size={20} className={isActive ? 'text-primary' : 'text-text-muted'} />
                            {item.name}
                        </Link>
                    );
                })}
            </div>

            <div className="p-4 border-t border-border space-y-2">
                <div className="flex items-center gap-3 px-2 mb-4">
                    <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm">
                        <ShieldCheck size={22} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="font-bold text-sm text-text-main truncate">{user?.name || 'Admin'}</div>
                        <div className="text-xs text-success font-black tracking-wide">SUPER ADMIN</div>
                    </div>
                </div>

                <button onClick={logout} className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-sm font-bold text-danger hover:bg-danger/10 rounded-xl transition-colors">
                    <LogOut size={18} /> Đăng xuất
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-surface flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border fixed h-full z-20">
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar */}
            {mobileOpen && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
                    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-border z-40 md:hidden flex flex-col animate-in slide-in-from-left duration-300">
                        {sidebarContent}
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
                <div className="flex-1 p-4 sm:p-8 w-full max-w-7xl mx-auto">{children}</div>
            </main>
        </div>
    );
}