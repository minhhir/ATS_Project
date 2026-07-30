import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { RecruiterLayout } from '@/layout/RecruiterLayout';
import { CandidateLayout } from '@/layout/CandidateLayout';
import { Button } from '@/ui/Button';
import { Bell, Check, CheckCircle2, Clock } from 'lucide-react';
import api from '@/api/axios';

// Vấn đề: Trang notifications dùng chung cho HR/admin/candidate nhưng layout sidebar khác nhau; nếu fix cứng 1 layout sẽ phá nav menu của role kia.
// Giải pháp: Pick layout theo role tại runtime, candidate dùng CandidateLayout, recruiter+admin dùng RecruiterLayout.
export function NotificationsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const isRecruiter = user?.role === 'recruiter' || user?.role === 'admin';
    const Layout = isRecruiter ? RecruiterLayout : CandidateLayout;

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. HÀM LẤY DATA
    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data.data);
        } catch (error) {
            console.error('Lỗi lấy thông báo', error);
        } finally {
            setLoading(false);
        }
    };

    // Vấn đề: User để mở trang notifications nhưng có notif mới sẽ không thấy nếu không refresh; set loading=true mỗi lần poll sẽ làm UI nhấp nháy.
    // Giải pháp: Polling 30s gọi fetchNotifications nhưng KHÔNG set loading lại — chỉ update list ngầm; cleanup clearInterval khi unmount.
    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // 3. ĐỌC 1 THÔNG BÁO VÀ CHUYỂN TRANG
    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) {
            try {
                await api.patch(`/notifications/${notif._id}/read`);
                setNotifications(prev =>
                    prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n)
                );
            } catch (error) {
                console.error('Lỗi khi đánh dấu đã đọc', error);
            }
        }
        if (notif.link) navigate(notif.link);
    };

    // 4. ĐỌC TẤT CẢ
    const handleMarkAllRead = async () => {
        const hasUnread = notifications.some(n => !n.isRead);
        if (!hasUnread) return;

        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Lỗi đọc tất cả', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                {/* Header trang */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main flex items-center gap-3">
                            <Bell className="text-primary" size={28} />
                            Tất cả thông báo
                        </h1>
                        <p className="text-text-muted mt-1 font-medium">
                            Bạn có <span className="font-bold text-primary">{unreadCount}</span> thông báo chưa đọc
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="outline" onClick={handleMarkAllRead} className="shrink-0 bg-white">
                            <Check size={18} className="mr-2" /> Đánh dấu đã đọc tất cả
                        </Button>
                    )}
                </div>

                {/* Danh sách thông báo */}
                <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden min-h-[50vh]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-text-muted font-semibold">
                            Đang tải thông báo...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 text-text-muted">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-text-main mb-2">Bạn đã xem hết thông báo</h3>
                            <p className="text-text-muted">Khi có hoạt động mới, chúng sẽ xuất hiện ở đây.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {notifications.map((notif) => (
                                <div
                                    key={notif._id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-6 flex gap-4 cursor-pointer hover:bg-surface transition-colors ${notif.isRead ? 'opacity-70 bg-white' : 'bg-primary/5'
                                        }`}
                                >
                                    {/* Chấm tròn báo trạng thái */}
                                    <div className="mt-1.5 shrink-0">
                                        <div className={`w-3 h-3 rounded-full ${notif.isRead ? 'bg-border' : 'bg-primary animate-pulse ring-4 ring-primary/20'}`}></div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-base mb-1 ${notif.isRead ? 'font-semibold text-text-main' : 'font-extrabold text-primary'}`}>
                                            {notif.title}
                                        </h4>
                                        <p className="text-sm text-text-muted font-medium mb-3 leading-relaxed">
                                            {notif.message}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-text-muted font-semibold">
                                            <Clock size={14} />
                                            {notif.createdAt ? new Date(notif.createdAt).toLocaleString('vi-VN') : 'Vừa xong'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}