import { Link } from 'react-router-dom';

/**
 * layout/AuthLayout.jsx
 * Wrapper dùng chung cho tất cả auth pages.
 * - variant="blue"   → Login/Register (màu primary blue)
 * - variant="orange" → Forgot/OTP/Reset (màu auth orange)
 */
export function AuthLayout({ children, variant = 'blue', showBackToLogin = false }) {
    const isOrange = variant === 'orange';

    return (
        <div
            className={`
        min-h-screen flex flex-col items-center justify-center p-4
        ${isOrange
                    ? 'bg-[#f8f6f6] dark:bg-[#221610]'
                    : 'bg-bg-light dark:bg-bg-dark'
                }
        font-display
      `}
        >
            {/* Logo */}
            <div className="mb-8 flex items-center gap-2">
                <div
                    className={`
            p-2 rounded-xl flex items-center justify-center text-white
            ${isOrange ? 'bg-auth' : 'bg-primary'}
          `}
                >
                    <span className="material-symbols-outlined text-xl">layers</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Mini ATS
                </span>
            </div>

            {/* Card */}
            <div className="w-full max-w-[440px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-card overflow-hidden">
                {showBackToLogin && (
                    <div className="px-8 pt-6">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary dark:hover:text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            Quay lại đăng nhập
                        </Link>
                    </div>
                )}
                {children}
            </div>

            {/* Footer links */}
            <div className="mt-8 flex items-center gap-6 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-medium">
                <Link to="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    Trợ giúp
                </Link>
                <Link to="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    Privacy
                </Link>
                <Link to="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    Terms
                </Link>
            </div>
        </div>
    );
}