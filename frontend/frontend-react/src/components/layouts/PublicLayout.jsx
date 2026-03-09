import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function PublicLayout() {
    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display antialiased">
            <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-border-light dark:border-border-dark px-6 py-4">
                <div className="max-w-[1440px] mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-4">
                        <div className="size-8 bg-primary flex items-center justify-center text-white rounded">
                            <span className="material-symbols-outlined text-xl">work</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight uppercase">Mini ATS</h1>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/jobs" className="text-slate-900 dark:text-white font-semibold text-sm hover:text-primary transition-colors">Find Jobs</Link>
                        <a href="#" className="text-text-muted hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium">Companies</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-semibold text-slate-900 dark:text-white hover:text-primary transition-colors">
                            Login
                        </Link>
                        <Link to="/register" className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-md text-sm font-bold transition-colors">
                            Sign Up
                        </Link>
                    </div>
                </div>
            </header>

            {/* Nội dung các trang Public sẽ hiển thị ở đây */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <Outlet />
            </div>

            <footer className="w-full py-6 text-center text-slate-400 dark:text-slate-600 text-xs border-t border-border-light dark:border-border-dark bg-white dark:bg-background-dark">
                © 2026 Mini ATS. All rights reserved.
            </footer>
        </div>
    );
}