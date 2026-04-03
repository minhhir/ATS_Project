import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Component route bảo vệ quyền truy cập dựa trên authentication và role
export function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    // check session rồi hiển thị loading spinner
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-500">Đang tải...</p>
                </div>
            </div>
        );
    }

    // Chưa đăng nhập thì về login, lưu intended location
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Đăng nhập rồi nhưng không đúng role
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect về đúng home của role
        const roleHome = {
            candidate: '/jobs',
            recruiter: '/recruiter/dashboard',
            admin: '/admin/dashboard',
        };
        return <Navigate to={roleHome[user.role] || '/'} replace />;
    }

    return children;
}