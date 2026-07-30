import axios from 'axios';

// Vấn đề: Lưu accessToken trong localStorage dễ bị XSS lấy mất; refreshToken cần gửi qua cookie httpOnly nhưng axios mặc định không gửi cookie cross-origin.
// Giải pháp: Giữ accessToken trong biến memory (window.__accessToken) - mất khi reload nhưng không thể XSS đọc - và bật withCredentials để cookie refresh tự đính kèm.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true,
});

// Vấn đề: Mỗi request cần gắn Bearer header, viết thủ công ở mọi call sẽ vừa lặp vừa dễ quên.
// Giải pháp: Interceptor request lấy token hiện hành từ memory và set Authorization tự động.
api.interceptors.request.use((config) => {
    const token = window.__accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Vấn đề: Khi access token hết hạn, nhiều request đồng thời sẽ cùng gọi /refresh → tạo race condition và rotate token nhiều lần.
// Giải pháp: Dùng cờ isRefreshing + failedQueue: request đầu tiên đi refresh, các request sau "xếp hàng" và replay với token mới.
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

        if (error.response?.status === 401 && !originalRequest._retry) {

            // Vấn đề: Nếu /login hay /refresh trả 401, retry sẽ tạo loop vô tận.
            // Giải pháp: Bỏ qua không retry các endpoint auth, đẩy lỗi nguyên về caller.
            if (originalRequest.url.includes('/login') || originalRequest.url.includes('/register') || originalRequest.url.includes('/refresh')) {
                return Promise.reject(error);
            }

            // Vấn đề: Trong lúc đang refresh, các request 401 khác cần đợi token mới chứ không gọi refresh tiếp.
            // Giải pháp: Push vào failedQueue, khi refresh xong thì processQueue resolve để các request đó replay.
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
                // Vấn đề: Nếu gọi api.post('/auth/refresh') thì interceptor lại bắn 401 đệ quy vô tận khi refresh fail.
                // Giải pháp: Dùng axios "trần" (không qua instance api) để bypass interceptor.
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

                processQueue(refreshError, null);
                window.__accessToken = null;

                // Vấn đề: Refresh fail nghĩa là user đã logout/expired hẳn; nếu đang ở public page mà force về /login sẽ phá UX của khách vãng lai.
                // Giải pháp: Chỉ redirect về /login khi user đang ở route private.
                const publicPaths = ['/', '/login', '/register', '/forgot-password', '/verify-otp', '/reset-password'];

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