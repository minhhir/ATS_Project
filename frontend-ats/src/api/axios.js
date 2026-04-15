import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true, // Quan trọng để gửi Cookie chứa refreshToken
});

// Thêm token vào header của mọi request
api.interceptors.request.use((config) => {
    const token = window.__accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Logic Refresh Token thông minh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Nếu lỗi 401 (Hết hạn Token) và chưa từng thử retry
        if (error.response?.status === 401 && !originalRequest._retry) {

            // Bỏ qua chặn bắt nếu API bị lỗi là login/register
            if (originalRequest.url.includes('/login') || originalRequest.url.includes('/register') || originalRequest.url.includes('/refresh')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Gửi request lấy token mới
                const { data } = await axios.post(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                window.__accessToken = data.accessToken;
                processQueue(null, data.accessToken);

                originalRequest.headers.Authorization = 'Bearer ' + data.accessToken;
                return api(originalRequest);

            } catch (refreshError) {
                // REFRESH THẤT BẠI (Token chết thật sự)
                processQueue(refreshError, null);
                window.__accessToken = null;

                // ✅ DANH SÁCH VÙNG AN TOÀN (Ai vào cũng được, không bao giờ bị đá)
                const publicPaths = ['/', '/login', '/register', '/forgot-password', '/verify-otp', '/reset-password'];

                // Nếu user ĐANG KHÔNG Ở VÙNG AN TOÀN -> Đá về trang đăng nhập
                if (!publicPaths.includes(window.location.pathname)) {
                    window.location.href = '/login';
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;