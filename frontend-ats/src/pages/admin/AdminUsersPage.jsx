import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layout/AdminLayout';
import { ConfirmDialog } from '@/ui/ConfirmDialog';
import { Skeleton } from '@/ui/Skeleton';
import { UserX, ShieldCheck } from 'lucide-react';
import api from '@/api/axios';

export function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    // Giữ user đang chờ xác nhận xóa; null nghĩa là dialog đóng.
    const [pendingDelete, setPendingDelete] = useState(null);

    // GỌI API THẬT
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await api.get('/admin/users');
                setUsers(data.data);
            } catch (error) {
                console.error('Lỗi tải người dùng:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // Vấn đề: Xóa user là không thể khôi phục, kèm cascade xóa job/application; nếu chỉ xóa ở client mà API fail sẽ làm UI lệch DB.
    // Giải pháp: Confirm trước, optimistic remove khỏi state sau khi API success; nếu API throw thì alert giữ nguyên list.
    //
    // Phần optimistic update dưới đây giữ nguyên. Chỉ đổi cơ chế hỏi: window.confirm luôn focus
    // sẵn vào OK nên một phím Enter theo quán tính là mất tài khoản; ConfirmDialog focus vào Hủy.
    const handleDeleteUser = async (id) => {
        try {
            await api.delete(`/admin/users/${id}`);
            setUsers(users.filter(u => u._id !== id));
            alert('Đã xóa người dùng thành công!');
        } catch {
            alert('Có lỗi xảy ra khi xóa!');
        }
    };

    const roleLabel = (role) => role === 'candidate' ? 'Ứng viên' : role === 'recruiter' ? 'Nhà tuyển dụng' : 'Quản trị viên';

    return (
        <AdminLayout>
            <div>
                <h1 className="text-2xl font-semibold text-text-main">Người dùng</h1>
                <p className="text-sm text-text-muted mt-1">
                    Toàn bộ tài khoản trên hệ thống. Xóa một tài khoản sẽ xóa cả dữ liệu họ đã tạo.
                </p>
            </div>

            <div className="border border-border rounded-lg bg-surface-raised overflow-hidden">
                {loading ? (
                    <div className="p-4 space-y-3" aria-busy="true" aria-label="Đang tải danh sách người dùng">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between gap-4">
                                <Skeleton className="h-4 w-64" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        ))}
                    </div>
                ) : users.length === 0 ? (
                    <p className="p-10 text-sm text-text-muted">
                        Chưa có tài khoản nào được tạo trên hệ thống.
                    </p>
                ) : (
                    <>
                        <div className="hidden md:block scroll-x">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-surface-sunken text-text-muted border-b border-border">
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs">Người dùng</th>
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs">Email</th>
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs">Vai trò</th>
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {users.map((u) => (
                                        <tr key={u._id} className="hover:bg-surface transition-colors">
                                            <td className="px-4 py-2.5">
                                                <div className="font-medium text-text-main">{u.name}</div>
                                                <div className="text-xs text-text-subtle font-mono">{u._id}</div>
                                            </td>
                                            <td className="px-4 py-2.5 text-text-muted">{u.email}</td>
                                            <td className="px-4 py-2.5">
                                                {/* Admin là vai trò đặc quyền nên đánh dấu bằng màu ngữ nghĩa;
                                                    hai vai trò còn lại là phân loại thường → chip trung tính. */}
                                                {u.role === 'admin' ? (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border border-danger-100 bg-danger-50 text-xs font-medium text-danger-700">
                                                        <ShieldCheck size={12} aria-hidden="true" /> Quản trị viên
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm border border-border text-xs text-text-muted">
                                                        {roleLabel(u.role)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-right">
                                                {/* Guard tự-block-mình: hàng admin không hiện nút xóa. Giữ nguyên. */}
                                                {u.role !== 'admin' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPendingDelete(u)}
                                                        aria-label={`Xóa tài khoản ${u.name}`}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-sm text-text-muted transition-colors cursor-pointer hover:bg-danger-50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                                    >
                                                        <UserX size={16} aria-hidden="true" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <ul className="md:hidden divide-y divide-border-subtle">
                            {users.map((u) => (
                                <li key={u._id} className="px-4 py-3 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="font-medium text-sm text-text-main truncate">{u.name}</div>
                                        <div className="text-xs text-text-muted truncate">{u.email}</div>
                                        <div className="text-xs text-text-subtle mt-1">{roleLabel(u.role)}</div>
                                    </div>
                                    {u.role !== 'admin' && (
                                        <button
                                            type="button"
                                            onClick={() => setPendingDelete(u)}
                                            aria-label={`Xóa tài khoản ${u.name}`}
                                            className="inline-flex items-center justify-center w-9 h-9 rounded-sm border border-border text-text-muted shrink-0 cursor-pointer hover:bg-danger-50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                        >
                                            <UserX size={16} aria-hidden="true" />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>

            <ConfirmDialog
                open={Boolean(pendingDelete)}
                title="Xóa tài khoản vĩnh viễn"
                message={pendingDelete
                    ? `Toàn bộ dữ liệu của ${pendingDelete.name} sẽ bị xóa cùng tài khoản và không khôi phục được.`
                    : ''}
                confirmLabel="Xóa tài khoản"
                onCancel={() => setPendingDelete(null)}
                onConfirm={() => {
                    const target = pendingDelete;
                    setPendingDelete(null);
                    if (target) handleDeleteUser(target._id);
                }}
            />
        </AdminLayout>
    );
}
