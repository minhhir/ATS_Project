import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { Bell, Check, CheckCircle2 } from 'lucide-react';

export function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false); // ✅ Fix 1: State quản lý Dropdown
    const bellRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data.data);
            setUnreadCount(data.data.filter(n => !n.isRead).length);
        } catch {
            console.error('Lỗi lấy thông báo');
        }
    };

    // Vấn đề: Realtime cần WebSocket nhưng dự án chưa có infra; nếu poll quá nhanh (5s) sẽ làm sập backend khi nhiều user mở đồng thời.
    // Giải pháp: Polling 30s là tradeoff hợp lý giữa "gần realtime" và tải server, kèm fetch initial qua setTimeout để tránh setState trong effect cycle đầu.
    useEffect(() => {
        const interval = setInterval(fetchNotifications, 30000);
        const initial = setTimeout(fetchNotifications, 0);
        return () => {
            clearInterval(interval);
            clearTimeout(initial);
        };
    }, []);

    // Vấn đề: Dropdown không tự đóng khi user click ra ngoài → UX khó chịu, che mất nút khác.
    // Giải pháp: Bind global mousedown để detect click ngoài bellRef và set open=false; cleanup khi unmount để tránh memory leak.
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (bellRef.current && !bellRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Vấn đề: User click vào notification mong vừa "đánh dấu đã đọc" vừa nhảy tới trang liên quan; nếu chờ API rồi mới navigate, UX chậm và bị block khi server lỗi.
    // Giải pháp: Optimistic update state trước, gọi API ngầm, navigate ngay sau để cảm nhận tức thì.
    const handleNotificationClick = async (notif) => {
        setOpen(false);
        if (!notif.isRead) {
            try {
                await api.patch(`/notifications/${notif._id}/read`);
                setNotifications(prev =>
                    prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error('Lỗi khi đánh dấu đã đọc', error);
            }
        }
        if (notif.link) navigate(notif.link);
    };

    // Vấn đề: Click vào nút "Đọc tất cả" sẽ bubble lên dropdown container → trigger handleClickOutside hoặc đóng menu; gọi API khi không có unread là phí request.
    // Giải pháp: stopPropagation để giữ menu mở, early return nếu unreadCount=0, optimistic update để badge ẩn ngay.
    const handleMarkAllRead = async (e) => {
        e.stopPropagation();
        if (unreadCount === 0) return;
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {
            // ignore: giữ nguyên UI nếu request lỗi
        }
    };

    return (
        <div className="relative" ref={bellRef}>
            {/* Nút Chuông */}
            <div
                className="p-2.5 bg-surface hover:bg-border rounded-full cursor-pointer relative transition-colors"
                onClick={() => setOpen(prev => !prev)}
            >
                <Bell size={20} className="text-text-muted" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-danger rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-pulse ring-2 ring-white">
                        {unreadCount}
                    </span>
                )}
            </div>

            {/* ✅ Fix 1: Chỉ render Dropdown khi open = true */}
            {open && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-border shadow-xl rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-border flex items-center justify-between bg-surface">
                        <h3 className="font-bold text-text-main">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1"
                            >
                                <Check size={14} /> Đọc tất cả
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-text-muted flex flex-col items-center">
                                <CheckCircle2 size={32} className="text-border mb-2" />
                                <span className="text-sm font-medium">Bạn đã xem hết thông báo</span>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif._id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-4 border-b border-border cursor-pointer hover:bg-surface transition-colors flex gap-3 ${notif.isRead ? 'opacity-70' : 'bg-primary/5'}`}
                                >
                                    {!notif.isRead && (
                                        <div className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0"></div>
                                    )}
                                    <div>
                                        <div className={`text-sm ${notif.isRead ? 'font-medium text-text-muted' : 'font-bold text-text-main'}`}>
                                            {notif.title}
                                        </div>
                                        <div className="text-xs text-text-muted mt-1 leading-relaxed">
                                            {notif.message}
                                        </div>
                                        <div className="text-[10px] text-text-muted mt-2 font-medium">
                                            {new Date(notif.createdAt).toLocaleString('vi-VN')}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}