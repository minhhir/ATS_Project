import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // true khi đang check session

    // Kiểm tra session khi app khởi động ──────────────────────────────────
    useEffect(() => {
        const checkSession = async () => {
            try {
                //refresh để lấy accessToken mới từ cookie
                const { data: refreshData } = await authAPI.refresh();
                window.__accessToken = refreshData.accessToken;

                // Lấy thông tin user
                const { data: meData } = await authAPI.getMe();
                setUser(meData.user);
            } catch {
                // Không có session hợp lệ  user => chưa đăng nhập
                setUser(null);
                window.__accessToken = null;
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    // login: gọi API, lưu token vào memory, set user
    const login = useCallback(async ({ email, password }) => {
        const { data } = await authAPI.login({ email, password });
        window.__accessToken = data.accessToken;
        setUser(data.user);
        return data.user;
    }, []);

    // register: gọi API, lưu token vào memory, set user
    const register = useCallback(async (formData) => {
        const { data } = await authAPI.register(formData);
        window.__accessToken = data.accessToken;
        // Sau register, fetch user info
        const { data: meData } = await authAPI.getMe();
        setUser(meData.user);
        return meData.user;
    }, []);

    // logout: gọi API, xóa token, set user null
    const logout = useCallback(async () => {
        try { await authAPI.logout(); } catch { }
        window.__accessToken = null;
        setUser(null);
    }, []);

    const value = { user, loading, login, register, logout, isAuthenticated: !!user };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// hook tiện dụng để dùng auth context
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth phải dùng bên trong AuthProvider');
    return ctx;
};