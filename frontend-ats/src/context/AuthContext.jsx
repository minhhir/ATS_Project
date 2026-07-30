import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';

const AuthContext = createContext(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth phải dùng bên trong AuthProvider');
    return ctx;
};

// Vấn đề: accessToken được giữ trong memory nên reload trang sẽ mất; nếu cứ render UI ngay khi chưa biết user là ai, ProtectedRoute sẽ kick về /login dù user thật ra đang đăng nhập.
// Giải pháp: Khi mount Provider, gọi /auth/refresh để lấy access token mới từ cookie httpOnly, sau đó /me để khôi phục user; trong lúc chờ thì đặt loading=true để route không redirect oan.
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: refreshData } = await api.post('/auth/refresh');
                window.__accessToken = refreshData.accessToken;

                const { data: meData } = await api.get('/auth/me');
                setUser(meData.user);
            } catch {
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

    // Vấn đề: Nếu chỉ clear state phía client, cookie refresh vẫn còn ở browser nên user sẽ tự động login lại sau reload; ngược lại nếu chờ server response mà server lỗi thì user kẹt lại mãi.
    // Giải pháp: Try gọi /logout để server clear cookie, ignore lỗi network và vẫn clear state local + redirect về trang chủ.
    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // ignore: server unreachable vẫn cần clear state phía client
        }
        window.__accessToken = null;
        setUser(null);
        window.location.href = '/';
    }, []);

    const updateUser = useCallback((data) => {
        setUser(prev => ({ ...prev, ...data }));
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            register,
            logout,
            updateUser,
            isAuthenticated: !!user,
        }}>
            {children}
        </AuthContext.Provider>
    );
};