import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { clsx } from 'clsx';

export default function DashboardLayout({ role = 'hr' }) {
    // Menu hiển thị dựa trên vai trò (HR hoặc Admin)
    const hrMenuItems = [
        { path: '/hr/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { path: '/hr/jobs', icon: 'work', label: 'Job Management' },
        { path: '/hr/candidates', icon: 'group', label: 'Candidates' },
        { path: '/hr/interviews', icon: 'calendar_month', label: 'Interviews' },
        { path: '/hr/analytics', icon: 'analytics', label: 'Analytics' },
        { path: '/hr/notifications', icon: 'notifications', label: 'Notifications' },
    ];

    const adminMenuItems = [
        { path: '/admin/dashboard', icon: 'admin_panel_settings', label: 'Platform Overview' },
        { path: '/admin/users', icon: 'manage_accounts', label: 'User Management' },
        { path: '/admin/reports', icon: 'assessment', label: 'System Reports' },
    ];

    const menuItems = role === 'admin' ? adminMenuItems : hrMenuItems;

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display min-h-screen flex overflow-hidden">

            {/* SIDEBAR BÊN TRÁI */}
            <aside className="hidden lg:flex w-64 flex-col bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark h-screen sticky top-0 shrink-0">
                <div className="p-6 flex items-center gap-3">
                    <div className="bg-primary text-white p-2 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">psychology</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-none tracking-tight">Mini ATS</h1>
                        <p className="text-text-muted text-xs font-medium mt-1">
                            {role === 'admin' ? 'Admin Console' : 'Recruiter Portal'}
                        </p>
                    </div>
                </div>

                <nav className="flex-1 px-4 flex flex-col gap-1 mt-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-md font-medium transition-colors group",
                                isActive
                                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                                    : "text-text-muted hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            <span className="material-symbols-outlined transition-colors">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-3 px-4 py-2">
                        <div className="relative">
                            <img
                                src={role === 'admin' ? "https://lh3.googleusercontent.com/aida-public/AB6AXuCmy8K4l_nWbukgIp_4J9ciuEPP3odVLMLJe367JNocslLwl9ucW-s5M6bsEvY5QSzzTB-GOAdql2sLGYXgvMGpPef_Hy2MPQr_PToSh0isNZbUg-HKCE-Ks2ayfIqpalookPVLGCrkJHlZwT1OR_uoNCrE6tu2JIrW3JhjJxigso5SYipKvEu9iziETEXMqnsuSyLiMIyDTtHRkO6Vy1YOB3_5aw0k5ZsXvt2ejeMm0WEDlYyj4_bnoxAYLM1nDB62WcVI0_XPdw" : "https://lh3.googleusercontent.com/aida-public/AB6AXuARS9inVWwFgPa6OE5CV699I4uvfq3zfWOxxDnb8G2zorLkhnduFSLYuTSy2IgiCB525xMh_BoBLLu4rv-ib7S9HC0dTF_LACFy5k-BB8xgToGBwKybkivwZl9wkJ1sfc4_VnlsiqcyQxnjPiOezIVxCJPEDKfWqZgcDJin6esG5AasmoncfooEqrGDK9LCNZkVJ4ztw1AdLwnPZT0cg8dpJFQpPy655roQkFXjnEUlTkN2BSELujUIsG_hyNd5Haw83IECDJPoEQ"}
                                alt="Profile"
                                className="h-10 w-10 rounded-full border border-border-light dark:border-border-dark object-cover"
                            />
                            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white dark:border-surface-dark"></div>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold truncate">Alex Morgan</span>
                            <span className="text-xs text-text-muted truncate">
                                {role === 'admin' ? 'System Admin' : 'Senior Recruiter'}
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* VÙNG NỘI DUNG CHÍNH Ở GIỮA */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-background-light dark:bg-background-dark scroll-smooth">

                {/* THANH TOPBAR */}
                <header className="bg-surface-light dark:bg-surface-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark sticky top-0 z-30 px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 lg:hidden">
                        <button className="text-text-muted hover:text-slate-900">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <span className="font-bold text-lg">Mini ATS</span>
                    </div>

                    <div className="hidden lg:flex">
                        <h2 className="text-xl font-bold tracking-tight">Workspace</h2>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative hidden md:block">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </span>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="block w-64 pl-10 pr-3 py-2 border border-border-light dark:border-border-dark rounded-md bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                            />
                        </div>
                        <button className="relative text-text-muted hover:text-slate-900 dark:hover:text-white transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 border border-white dark:border-surface-dark"></span>
                        </button>
                    </div>
                </header>

                {/* NỘI DUNG CỦA CÁC TRANG DASHBOARD, JOB MANAGEMENT... SẼ CHẢY VÀO ĐÂY */}
                <div className="p-6 md:p-8 flex flex-col gap-8 w-full mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
