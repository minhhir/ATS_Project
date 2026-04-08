import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';

const AuthContext = createContext(null);
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth phải dùng bên trong AuthProvider');
    return ctx;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const checkSession = async () => {
            try {
                // Thử refresh để lấy accessToken mới từ cookie
                const { data: refreshData } = await api.post('/auth/refresh');
                window.__accessToken = refreshData.accessToken;

                // Lấy thông tin user hiện tại
                const { data: meData } = await api.get('/auth/me');
                setUser(meData.user);
            } catch {
                // Không có session hợp lệ — user chưa đăng nhập, không cần làm gì
                window.__accessToken = null;
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = useCallback(async (data) => {
        const { data: res } = await api.post('/auth/login', data);
        window.__accessToken = res.accessToken;
        setUser(res.user);
        return res.user;
    }, []);

    const register = useCallback(async (data) => {
        const { data: res } = await api.post('/auth/register', data);
        window.__accessToken = res.accessToken;
        setUser(res.user);
        return res.user;
    }, []);

    const logout = useCallback(async () => {
        try { await api.post('/auth/logout'); } catch { }
        window.__accessToken = null;
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            register,
            logout,
            isAuthenticated: !!user,
        }}>
            {children}
        </AuthContext.Provider>
    );
};