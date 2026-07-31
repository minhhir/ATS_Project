import { useState, useEffect, useRef, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { Bell, Check, CheckCircle2 } from 'lucide-react';

export function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false); // ✅ Fix 1: State quản lý Dropdown
    // useId: chuông xuất hiện trên mọi trang có DashboardShell, id cứng sẽ trùng nếu sau này
    // có hai instance (vd header + trang thông báo) cùng render.
    const panelId = useId();
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
            {/* Vấn đề: đây từng là <div onClick>. Div không nằm trong thứ tự Tab và không phản ứng với
                Enter/Space, nên người dùng bàn phím không có cách nào mở được thông báo — trong khi HR
                duyệt hồ sơ hàng loạt là nhóm dùng bàn phím nhiều nhất.
                Giải pháp: <button> thật, có sẵn focus/keyboard của trình duyệt; aria-expanded cho biết
                dropdown đang mở hay đóng. Số chưa đọc đưa vào nhãn vì badge là hình, không đọc được.

                Cố tình KHÔNG dùng aria-haspopup="menu" và role="menu": panel này là danh sách nội dung
                đọc được, không phải menu lệnh. Khai báo là menu thì screen reader hứa với người dùng một
                bộ phím điều hướng (mũi tên lên/xuống, Home/End) mà panel không có. aria-controls nói đúng
                quan hệ "nút này đóng/mở khối kia" mà không hứa gì thêm. */}
            {/* Nền chỉ hiện khi hover: chuông nằm cố định ở header mọi trang, tô nền thường trực biến
                nó thành một khối xám luôn có mặt trong tầm mắt mà phần lớn thời gian không có gì để báo.
                Bo 4px thay vì tròn — tròn là bậc dành cho avatar và chấm trạng thái. */}
            <button
                type="button"
                className="p-2.5 hover:bg-surface rounded-md cursor-pointer relative transition-colors"
                onClick={() => setOpen(prev => !prev)}
                aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
                aria-expanded={open}
                aria-controls={panelId}
            >
                <Bell size={20} className="text-text-muted" />
                {unreadCount > 0 && (
                    // aria-hidden: con số đã nằm trong aria-label của nút, để nguyên sẽ bị đọc hai lần.
                    // Bỏ animate-pulse: chấm nhấp nháy liên tục kéo mắt về nó suốt phiên làm việc, trong
                    // khi thông báo mới không phải việc gấp. Màu danger trên nền trắng đã đủ để thấy.
                    // Giữ rounded-full: bong bóng đếm là quy ước tròn, không phải badge chữ.
                    <span aria-hidden="true" className="absolute top-0 right-0 w-4 h-4 bg-danger rounded-full flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Chỉ render dropdown khi open = true.
                shadow-lg là bậc của dropdown/popover; shadow-xl để dành cho modal (index.css:70-72). */}
            {open && (
                <div id={panelId} className="absolute right-0 mt-3 w-80 bg-surface-raised border border-border shadow-lg rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
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
                                // Từng là <div onClick>: không Tab tới được nên người dùng bàn phím mở được
                                // dropdown cũng không đọc hay mở được thông báo nào. w-full + text-left để
                                // <button> giữ nguyên khối chiếm hết bề ngang và chữ căn trái như cũ.
                                <button
                                    type="button"
                                    key={notif._id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`w-full text-left p-4 border-b border-border cursor-pointer hover:bg-surface transition-colors flex gap-3 ${notif.isRead ? 'opacity-70' : 'bg-primary/5'}`}
                                >
                                    {/* <button> chỉ nhận phrasing content, nên mọi <div> bên trong đổi sang
                                        <span className="block"> — cùng display, cùng class, nhưng HTML hợp lệ. */}
                                    {!notif.isRead && (
                                        <span className="block mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0"></span>
                                    )}
                                    <span className="block">
                                        <span className={`block text-sm ${notif.isRead ? 'font-medium text-text-muted' : 'font-bold text-text-main'}`}>
                                            {notif.title}
                                        </span>
                                        <span className="block text-xs text-text-muted mt-1 leading-relaxed">
                                            {notif.message}
                                        </span>
                                        <span className="block text-xs text-text-subtle mt-2">
                                            {new Date(notif.createdAt).toLocaleString('vi-VN')}
                                        </span>
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}