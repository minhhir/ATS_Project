import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

// Vấn đề: Khi reload, AuthContext vẫn đang refresh session - render Navigate trong lúc đó sẽ kick user đang login về /login; user sai role có thể tự gõ URL admin để truy cập trang admin.
// Giải pháp: Show loader trong khi loading, redirect về /login nếu user null (kèm state.from để login xong quay lại đúng trang), redirect về / nếu role không khớp allowedRoles.
export function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm font-medium text-text-muted">Đang tải dữ liệu...</span>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
}